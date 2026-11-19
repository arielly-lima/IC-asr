import http from 'node:http';
import { readFileSync, mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COOKIE = 'ic_voice_session';
const INTERFACE_VERSION = '0.4.0-ux';
const EVALUATION_VERSION = 'ux-exploratorio-v1';
const MAX_AUDIO = 25 * 1024 * 1024;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const digest = value => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const mimeExtensions = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/x-wav': 'wav' };
const eventTypes = new Set(['recording_started', 'recording_stopped', 'rerecorded', 'playback_started', 'send_failed', 'microphone_error']);

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function validateConfig(config) {
  if (!config || !/^[a-zA-Z0-9_-]{1,80}$/.test(config.bankVersion) || !Number.isInteger(config.goalSize) || config.goalSize < 1 || config.goalSize > 1000) throw new Error('Configuração de banco ou meta inválida.');
  if (!Array.isArray(config.phrases) || !config.phrases.length || !config.practicePhrase || !Array.isArray(config.participants) || !config.participants.length) throw new Error('Configure frases, familiarização e códigos de teste.');
  const ids = new Set();
  for (const phrase of [config.practicePhrase, ...config.phrases]) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(phrase.id) || ids.has(phrase.id) || typeof phrase.text !== 'string' || !phrase.text.trim() || phrase.text.length > 1000) throw new Error('Identificador ou texto de frase inválido/duplicado.');
    if (phrase.domain != null && (typeof phrase.domain !== 'string' || phrase.domain.length > 100)) throw new Error('Categoria de frase inválida.');
    ids.add(phrase.id);
  }
  const codes = new Set(); const participantIds = new Set();
  for (const item of config.participants) {
    item.code = String(item.code ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9-]{6,64}$/.test(item.code) || codes.has(item.code) || !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) || participantIds.has(item.id) || !['neutral', 'gamified'].includes(item.condition)) throw new Error('Código, condição ou identificador de teste inválido/duplicado.');
    codes.add(item.code); participantIds.add(item.id);
  }
  return config;
}

function sendJson(res, status, value, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...extra });
  res.end(JSON.stringify(value));
}

async function body(req, max) {
  if (Number(req.headers['content-length']) > max) throw new ApiError(413, 'O arquivo é maior que 25 MB. Faça uma gravação mais curta.');
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > max) throw new ApiError(413, 'O envio ultrapassou o tamanho permitido.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function jsonBody(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new ApiError(415, 'Formato de solicitação inválido.');
  try { return JSON.parse((await body(req, 32768)).toString('utf8')); }
  catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'Solicitação incompleta ou inválida.'); }
}

function looksLikeAudio(bytes, mime) {
  if (bytes.length < 16) return false;
  if (mime === 'audio/webm') return bytes.subarray(0, 4).toString('hex') === '1a45dfa3';
  if (mime === 'audio/ogg') return bytes.subarray(0, 4).toString() === 'OggS';
  if (mime === 'audio/mp4') return bytes.subarray(4, 8).toString() === 'ftyp';
  return bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WAVE';
}

export function createApplication(options = {}) {
  const config = validateConfig(structuredClone(options.config ?? JSON.parse(readFileSync(path.join(HERE, 'config.json'), 'utf8'))));
  const imageManifest = JSON.parse(readFileSync(path.join(HERE, 'phrase-images.json'), 'utf8'));
  const phraseImages = new Map();
  for (const image of imageManifest.images) {
    if (!/^[a-zA-Z0-9_-]+\.webp$/.test(image.file) || phraseImages.has(image.phraseId)) throw new Error('Imagem de frase inválida ou duplicada.');
    phraseImages.set(image.phraseId, image);
  }
  const dataDir = path.resolve(options.dataDir ?? path.join(HERE, 'data'));
  const audioDir = path.join(dataDir, 'audio');
  mkdirSync(audioDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'coleta.sqlite'));
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY, condition TEXT NOT NULL CHECK(condition IN ('neutral','gamified')),
      data_kind TEXT NOT NULL DEFAULT 'technical', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS banks (version TEXT PRIMARY KEY, content TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, participant_id TEXT NOT NULL REFERENCES participants(id),
      token_hash TEXT UNIQUE NOT NULL, started_at TEXT NOT NULL, ended_at TEXT,
      end_reason TEXT, bank_version TEXT NOT NULL REFERENCES banks(version), goal_size INTEGER NOT NULL,
      interface_version TEXT NOT NULL DEFAULT '0.1.0'
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, participant_id TEXT NOT NULL REFERENCES participants(id),
      bank_version TEXT NOT NULL REFERENCES banks(version), phrase_id TEXT NOT NULL,
      phase TEXT NOT NULL CHECK(phase IN ('practice','collection')), phrase_text TEXT NOT NULL,
      domain TEXT, started_at TEXT NOT NULL, confirmed_at TEXT,
      UNIQUE(participant_id, bank_version, phase, phrase_id)
    );
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL UNIQUE, task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id),
      session_id TEXT NOT NULL REFERENCES sessions(id), mime_type TEXT NOT NULL, byte_length INTEGER NOT NULL,
      duration_ms REAL NOT NULL, audio_path TEXT NOT NULL, sha256 TEXT NOT NULL, confirmed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id),
      task_id TEXT REFERENCES tasks(id), type TEXT NOT NULL, server_at TEXT NOT NULL,
      client_at TEXT, detail TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS tasks_participant ON tasks(participant_id, bank_version);
    CREATE INDEX IF NOT EXISTS events_session ON events(session_id);
    CREATE TABLE IF NOT EXISTS evaluations (
      session_id TEXT PRIMARY KEY REFERENCES sessions(id), questionnaire_version TEXT NOT NULL,
      ease INTEGER CHECK(ease BETWEEN 1 AND 5), gamefulness INTEGER CHECK(gamefulness BETWEEN 1 AND 5),
      fatigue INTEGER CHECK(fatigue BETWEEN 1 AND 5), images TEXT, comment TEXT NOT NULL DEFAULT '',
      responded_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );`);
  if (!db.prepare('PRAGMA table_info(sessions)').all().some(column => column.name === 'interface_version')) {
    db.exec("ALTER TABLE sessions ADD COLUMN interface_version TEXT NOT NULL DEFAULT '0.1.0'");
  }

  const bankContent = JSON.stringify({ practicePhrase: config.practicePhrase, phrases: config.phrases });
  const savedBank = db.prepare('SELECT content FROM banks WHERE version=?').get(config.bankVersion);
  if (savedBank && savedBank.content !== bankContent) { db.close(); throw new Error('O banco mudou sem mudar bankVersion. Use uma nova versão para preservar os registros.'); }
  db.prepare('INSERT OR IGNORE INTO banks(version,content) VALUES(?,?)').run(config.bankVersion, bankContent);
  for (const participant of config.participants) {
    const saved = db.prepare('SELECT condition FROM participants WHERE id=?').get(participant.id);
    if (saved && saved.condition !== participant.condition) { db.close(); throw new Error(`A condição de ${participant.id} já está registrada. Use um novo código/identificador para outro teste.`); }
    db.prepare('INSERT OR IGNORE INTO participants(id,condition,created_at) VALUES(?,?,?)').run(participant.id, participant.condition, now());
  }

  function transaction(fn) {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  function addEvent(sessionId, type, taskId = null, detail = {}) {
    db.prepare('INSERT INTO events(id,session_id,task_id,type,server_at,detail) VALUES(?,?,?,?,?,?)').run(randomUUID(), sessionId, taskId, type, now(), JSON.stringify(detail));
  }
  function authenticate(req, active = false) {
    const token = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, 'Entre com seu código para continuar.');
    const session = db.prepare(`SELECT s.*, p.condition, p.data_kind FROM sessions s JOIN participants p ON p.id=s.participant_id WHERE token_hash=?`).get(digest(token));
    if (!session || Date.now() - Date.parse(session.started_at) > 30 * 86400000) throw new ApiError(401, 'Sua sessão expirou. Entre novamente com o mesmo código.');
    if (session.bank_version !== config.bankVersion) throw new ApiError(401, 'O material foi atualizado. Entre novamente com seu código.');
    if (active && session.ended_at) throw new ApiError(410, 'A sessão está pausada. Retome para continuar.');
    if (active && session.interface_version !== INTERFACE_VERSION) throw new ApiError(409, 'A interface foi atualizada. Recarregue a página para retomar com o mesmo código.');
    return session;
  }
  function state(session) {
    const records = db.prepare(`SELECT t.id AS task_id, t.phase, r.duration_ms FROM tasks t JOIN recordings r ON r.task_id=t.id WHERE t.participant_id=? AND t.bank_version=?`).all(session.participant_id, config.bankVersion);
    const collection = records.filter(r => r.phase === 'collection');
    const sent = new Set(db.prepare(`SELECT phrase_id FROM tasks WHERE participant_id=? AND bank_version=? AND phase='collection' AND confirmed_at IS NOT NULL`).all(session.participant_id, config.bankVersion).map(t => t.phrase_id));
    return {
      participantId: session.participant_id, condition: session.condition, dataKind: 'technical',
      sessionId: session.id, paused: Boolean(session.ended_at), bankVersion: config.bankVersion,
      interfaceVersion: session.interface_version, requiresResume: session.interface_version !== INTERFACE_VERSION,
      totalPhrases: config.phrases.length,
      confirmedCount: collection.length, durationMs: collection.reduce((sum, r) => sum + r.duration_ms, 0),
      practiceDone: records.some(r => r.phase === 'practice'), confirmedTaskIds: records.map(r => r.task_id),
      nextPhrase: config.phrases.find(p => !sent.has(p.id)) ?? null,
      goalSize: session.condition === 'gamified' ? session.goal_size : null,
      evaluation: db.prepare('SELECT * FROM evaluations WHERE session_id=?').get(session.id) ?? null
    };
  }
  function startSession(participantId, res) {
    const id = randomUUID(); const token = randomBytes(32).toString('hex'); const timestamp = now();
    transaction(() => {
      const previous = db.prepare('SELECT id FROM sessions WHERE participant_id=? AND ended_at IS NULL').all(participantId);
      for (const old of previous) {
        db.prepare("UPDATE sessions SET ended_at=?,end_reason='reentered' WHERE id=?").run(timestamp, old.id);
        addEvent(old.id, 'session_ended', null, { reason: 'reentered' });
      }
      db.prepare('INSERT INTO sessions(id,participant_id,token_hash,started_at,bank_version,goal_size,interface_version) VALUES(?,?,?,?,?,?,?)').run(id, participantId, digest(token), timestamp, config.bankVersion, config.goalSize, INTERFACE_VERSION);
      addEvent(id, 'session_started');
    });
    res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`);
    return db.prepare('SELECT s.*, p.condition FROM sessions s JOIN participants p ON p.id=s.participant_id WHERE s.id=?').get(id);
  }
  function endSession(session, reason) {
    if (!session.ended_at) transaction(() => {
      db.prepare('UPDATE sessions SET ended_at=?,end_reason=? WHERE id=?').run(now(), reason, session.id);
      addEvent(session.id, 'session_ended', null, { reason });
    });
  }

  const staticFiles = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/index.html': ['index.html', 'text/html; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
    '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
    '/favicon.svg': ['favicon.svg', 'image/svg+xml']
  };
  for (const image of phraseImages.values()) staticFiles[`/assets/phrases/${image.file}`] = [`assets/phrases/${image.file}`, 'image/webp'];

  function phraseImage(phrase) {
    const image = phraseImages.get(phrase.id);
    if (!image || image.text !== phrase.text || !existsSync(path.join(HERE, 'public', 'assets', 'phrases', image.file))) return null;
    return { src: `/assets/phrases/${image.file}`, alt: image.redundantWithPhrase ? '' : image.alt, width: image.width, height: image.height };
  }

  async function handle(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'microphone=(self), camera=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; media-src 'self' blob:; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try {
      const host = req.headers.host ?? '';
      if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) throw new ApiError(403, 'Este protótipo atende apenas acesso local.');
      if (req.headers.origin && req.headers.origin !== `http://${host}`) throw new ApiError(403, 'Origem da solicitação não autorizada.');
      const url = new URL(req.url, `http://${host}`);
      if (req.method === 'GET' && staticFiles[url.pathname]) {
        const [file, mime] = staticFiles[url.pathname];
        res.writeHead(200, { 'Content-Type': mime }); res.end(readFileSync(path.join(HERE, 'public', file))); return;
      }
      if (req.method === 'GET' && url.pathname === '/api/health') { sendJson(res, 200, { ok: true, mode: 'technical', interfaceVersion: INTERFACE_VERSION }); return; }
      if (req.method === 'POST' && url.pathname === '/api/session') {
        const input = await jsonBody(req);
        const code = typeof input?.code === 'string' ? input.code.trim().toUpperCase() : '';
        const participant = config.participants.find(p => p.code === code);
        if (!participant) throw new ApiError(401, 'Código não encontrado. Confira o código recebido e tente novamente.');
        sendJson(res, 201, state(startSession(participant.id, res))); return;
      }
      if (!url.pathname.startsWith('/api/')) throw new ApiError(404, 'Página não encontrada.');
      const session = authenticate(req);
      if (req.method === 'GET' && url.pathname === '/api/state') { sendJson(res, 200, state(session)); return; }
      if (req.method === 'POST' && url.pathname === '/api/evaluation') {
        const input = await jsonBody(req);
        if (!input || !UUID.test(input.sessionId ?? '')) throw new ApiError(400, 'Não foi possível identificar a sessão. Recarregue a página.');
        const source = db.prepare('SELECT * FROM sessions WHERE id=? AND participant_id=? AND bank_version=?').get(input.sessionId, session.participant_id, config.bankVersion);
        if (!source) throw new ApiError(403, 'Sessão não autorizada.');
        if (source.interface_version !== INTERFACE_VERSION) throw new ApiError(409, 'A interface foi atualizada. Recarregue a página antes de responder.');
        for (const field of ['ease', 'gamefulness', 'fatigue']) {
          if (input[field] != null && (!Number.isInteger(input[field]) || input[field] < 1 || input[field] > 5)) throw new ApiError(400, 'Escolha uma das respostas disponíveis.');
        }
        if (input.images != null && !['helped','neutral','distracting','unclear','not_seen'].includes(input.images)) throw new ApiError(400, 'Escolha uma das opções sobre as imagens.');
        if (input.comment != null && (typeof input.comment !== 'string' || input.comment.length > 1000)) throw new ApiError(400, 'Use até 1.000 caracteres no comentário.');
        const comment = (input.comment ?? '').trim();
        if (['ease','gamefulness','fatigue','images'].every(key => input[key] == null) && !comment) throw new ApiError(400, 'Responda ao menos uma pergunta ou deixe um comentário para enviar.');
        const timestamp = now();
        db.prepare(`INSERT INTO evaluations(session_id,questionnaire_version,ease,gamefulness,fatigue,images,comment,responded_at,updated_at)
          VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(session_id) DO UPDATE SET
          ease=excluded.ease,gamefulness=excluded.gamefulness,fatigue=excluded.fatigue,images=excluded.images,
          comment=excluded.comment,updated_at=excluded.updated_at`).run(source.id, EVALUATION_VERSION, input.ease ?? null, input.gamefulness ?? null, input.fatigue ?? null, input.images ?? null, comment, timestamp, timestamp);
        sendJson(res, 200, { saved: true, evaluation: db.prepare('SELECT * FROM evaluations WHERE session_id=?').get(source.id) }); return;
      }
      if (req.method === 'POST' && url.pathname === '/api/resume') { await jsonBody(req); sendJson(res, 201, state(session.ended_at || session.interface_version !== INTERFACE_VERSION ? startSession(session.participant_id, res) : session)); return; }
      if (req.method === 'POST' && url.pathname === '/api/end') {
        const input = await jsonBody(req); const reason = input?.reason === 'completed' ? 'completed' : 'paused';
        endSession(session, reason);
        sendJson(res, 200, state({ ...session, ended_at: now() })); return;
      }
      if (req.method === 'POST' && url.pathname === '/api/logout') {
        await jsonBody(req); endSession(session, 'logout');
        res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
        sendJson(res, 200, { ok: true }); return;
      }
      if (req.method === 'POST' && url.pathname === '/api/tasks/start') {
        if (session.ended_at) throw new ApiError(410, 'A sessão está pausada. Retome para continuar.');
        if (session.interface_version !== INTERFACE_VERSION) throw new ApiError(409, 'A interface foi atualizada. Recarregue a página para retomar.');
        const input = await jsonBody(req);
        if (!['practice', 'collection'].includes(input?.phase)) throw new ApiError(400, 'Etapa inválida.');
        const current = state(session);
        if (input.phase === 'collection' && !current.practiceDone) throw new ApiError(409, 'Conclua a familiarização antes de iniciar.');
        if (input.phase === 'practice' && current.practiceDone) throw new ApiError(409, 'A familiarização já foi concluída.');
        const phrase = input.phase === 'practice' ? config.practicePhrase : current.nextPhrase;
        if (!phrase) throw new ApiError(409, 'Todas as frases deste material já foram enviadas.');
        let task = db.prepare('SELECT * FROM tasks WHERE participant_id=? AND bank_version=? AND phase=? AND phrase_id=?').get(session.participant_id, config.bankVersion, input.phase, phrase.id);
        if (!task) {
          transaction(() => {
            const id = randomUUID();
            db.prepare('INSERT INTO tasks(id,participant_id,bank_version,phase,phrase_id,phrase_text,domain,started_at) VALUES(?,?,?,?,?,?,?,?)').run(id, session.participant_id, config.bankVersion, input.phase, phrase.id, phrase.text, phrase.domain ?? null, now());
            addEvent(session.id, 'task_started', id, { phase: input.phase });
            task = db.prepare('SELECT * FROM tasks WHERE id=?').get(id);
          });
        }
        const image = phraseImage({ id: task.phrase_id, text: task.phrase_text });
        sendJson(res, 200, { taskId: task.id, phase: task.phase, phrase: { id: task.phrase_id, text: task.phrase_text, ...(image ? { image } : {}) }, state: current }); return;
      }
      if (req.method === 'POST' && url.pathname === '/api/events') {
        const input = await jsonBody(req);
        if (!Array.isArray(input?.events) || input.events.length > 10) throw new ApiError(400, 'Lista de eventos inválida.');
        const validated = input.events.map(e => {
          if (!e || !UUID.test(e.id) || !UUID.test(e.taskId) || !eventTypes.has(e.type)) throw new ApiError(400, 'Evento inválido.');
          const task = db.prepare('SELECT participant_id FROM tasks WHERE id=?').get(e.taskId);
          if (!task || task.participant_id !== session.participant_id) throw new ApiError(403, 'Tarefa não autorizada.');
          const sourceSessionId = e.sessionId ?? session.id;
          if (!UUID.test(sourceSessionId)) throw new ApiError(400, 'Sessão de evento inválida.');
          const sourceSession = db.prepare('SELECT participant_id,bank_version FROM sessions WHERE id=?').get(sourceSessionId);
          if (!sourceSession || sourceSession.participant_id !== session.participant_id || sourceSession.bank_version !== config.bankVersion) throw new ApiError(403, 'Sessão de evento não autorizada.');
          const clientAt = typeof e.clientAt === 'string' && Number.isFinite(Date.parse(e.clientAt)) ? new Date(e.clientAt).toISOString() : null;
          const detail = {};
          if (typeof e.reason === 'string') detail.reason = e.reason.slice(0, 80);
          return { ...e, sourceSessionId, clientAt, detail };
        });
        transaction(() => {
          for (const e of validated) {
            const prior = db.prepare('SELECT session_id,task_id,type FROM events WHERE id=?').get(e.id);
            if (prior) {
              const owner = db.prepare('SELECT participant_id FROM sessions WHERE id=?').get(prior.session_id);
              if (owner.participant_id !== session.participant_id || prior.task_id !== e.taskId || prior.type !== e.type) throw new ApiError(409, 'Identificador de evento já utilizado.');
              continue;
            }
            db.prepare('INSERT INTO events(id,session_id,task_id,type,server_at,client_at,detail) VALUES(?,?,?,?,?,?,?)').run(e.id, e.sourceSessionId, e.taskId, e.type, now(), e.clientAt, JSON.stringify(e.detail));
          }
        });
        sendJson(res, 200, { ok: true }); return;
      }
      if (req.method === 'POST' && url.pathname === '/api/recordings') {
        if (session.ended_at) throw new ApiError(410, 'A sessão está pausada. Retome para continuar.');
        const taskId = req.headers['x-task-id']; const attemptId = req.headers['x-attempt-id'];
        const duration = Number(req.headers['x-duration-ms']);
        const mime = req.headers['content-type']?.split(';')[0].trim().toLowerCase();
        if (!UUID.test(taskId ?? '') || !UUID.test(attemptId ?? '') || !Number.isFinite(duration) || duration <= 0 || duration > 86400000) throw new ApiError(400, 'Metadados da gravação inválidos. Grave novamente.');
        if (!mimeExtensions[mime]) throw new ApiError(415, 'Formato de áudio não aceito. Tente outro navegador.');
        const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(taskId);
        if (!task || task.participant_id !== session.participant_id || task.bank_version !== config.bankVersion) throw new ApiError(403, 'Gravação não corresponde à sua tarefa atual.');
        const bytes = await body(req, MAX_AUDIO);
        authenticate(req, true);
        if (!looksLikeAudio(bytes, mime)) throw new ApiError(422, 'O arquivo de áudio está vazio ou não tem o formato esperado. Grave novamente.');
        const hash = digest(bytes);
        const prior = db.prepare('SELECT * FROM recordings WHERE attempt_id=?').get(attemptId);
        if (prior) {
          if (prior.task_id !== taskId || prior.sha256 !== hash || prior.mime_type !== mime || prior.duration_ms !== duration) throw new ApiError(409, 'Este identificador pertence a outro envio. Atualize a sessão.');
          if (!existsSync(path.join(dataDir, prior.audio_path))) throw new ApiError(503, 'O arquivo confirmado não está disponível. Procure o responsável pelo teste.');
          sendJson(res, 200, { confirmed: true, recordingId: prior.id, duplicate: true, state: state(session) }); return;
        }
        if (task.confirmed_at) throw new ApiError(409, 'Esta frase já foi recebida em outra tentativa. Retome a sequência.');
        const id = randomUUID(); const relativePath = `audio/${id}.${mimeExtensions[mime]}`;
        const absolutePath = path.join(dataDir, relativePath); const timestamp = now();
        try {
          writeFileSync(absolutePath, bytes, { flag: 'wx', flush: true });
          transaction(() => {
            options.beforeRecordingCommit?.();
            db.prepare('INSERT INTO recordings(id,attempt_id,task_id,session_id,mime_type,byte_length,duration_ms,audio_path,sha256,confirmed_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id, attemptId, taskId, session.id, mime, bytes.length, duration, relativePath, hash, timestamp);
            db.prepare('UPDATE tasks SET confirmed_at=? WHERE id=?').run(timestamp, taskId);
            addEvent(session.id, 'audio_confirmed', taskId, { recordingId: id });
          });
        } catch (error) {
          if (existsSync(absolutePath)) unlinkSync(absolutePath);
          throw error;
        }
        sendJson(res, 201, { confirmed: true, recordingId: id, duplicate: false, state: state(session) }); return;
      }
      throw new ApiError(404, 'Ação não encontrada.');
    } catch (error) {
      if (!res.headersSent && !res.destroyed) sendJson(res, error.status ?? 500, { error: error.status ? error.message : 'Não foi possível salvar. Sua gravação permanece disponível para tentar novamente.' });
      if (!error.status) options.onError?.(error);
    }
  }

  const server = http.createServer((req, res) => { void handle(req, res); });
  server.requestTimeout = 120000;
  server.headersTimeout = 15000;
  return {
    server, dataDir,
    async listen(port = 3000) {
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); }); });
      return `http://localhost:${server.address().port}`;
    },
    async close() {
      if (server.listening) await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
      db.close();
    }
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = createApplication({ onError: error => console.error('Falha de armazenamento:', error.code ?? error.message) });
  try {
    const url = await app.listen(Number(process.env.PORT ?? 3000));
    console.log(`Protótipo de coleta de voz: ${url}\nSomente testes técnicos. Áudios em ${path.join(app.dataDir, 'audio')}`);
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await app.close(); process.exit(0); });
  } catch (error) {
    console.error(error.code === 'EADDRINUSE' ? 'A porta está ocupada. Use outra porta com a variável PORT.' : error.message);
    await app.close(); process.exitCode = 1;
  }
}
