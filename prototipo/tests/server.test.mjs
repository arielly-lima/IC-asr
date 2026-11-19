import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { createApplication } from '../server.mjs';

const config = {
  bankVersion: 'technical-test-v1', goalSize: 5,
  practicePhrase: { id: 'practice', text: 'Teste do gravador.' },
  phrases: [{ id: 'a', text: 'Primeira frase.' }, { id: 'b', text: 'Segunda frase.' }],
  participants: [{ id: 'g', code: 'TEST-G01', condition: 'gamified' }, { id: 'n', code: 'TEST-N01', condition: 'neutral' }]
};
function wav() {
  const buffer = Buffer.alloc(44 + 3200);
  buffer.write('RIFF'); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(16000, 24); buffer.writeUInt32LE(32000, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(3200, 40); return buffer;
}
function safeRemove(directory) {
  const base = path.resolve(tmpdir()); const target = path.resolve(directory);
  assert.equal(path.dirname(target), base);
  assert.ok(path.basename(target).startsWith('ic-voice-test-'));
  rmSync(target, { recursive: true, force: true });
}
async function fixture(t, extra = {}) {
  const dataDir = mkdtempSync(path.join(tmpdir(), 'ic-voice-test-'));
  let app = createApplication({ dataDir, config, ...extra });
  let url = await app.listen(0);
  t.after(async () => { await app.close(); safeRemove(dataDir); });
  async function request(route, { cookie, value, ...options } = {}) {
    const headers = { ...(cookie ? { Cookie: cookie } : {}), ...(value !== undefined ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
    const response = await fetch(url + route, { ...options, headers, ...(value !== undefined ? { body: JSON.stringify(value), method: 'POST' } : {}) });
    const contentType = response.headers.get('content-type');
    return { status: response.status, headers: response.headers, data: contentType?.includes('json') ? await response.json() : await response.text() };
  }
  async function login(code = 'TEST-G01') {
    const result = await request('/api/session', { value: { code } });
    assert.equal(result.status, 201);
    return { cookie: result.headers.get('set-cookie').split(';')[0], state: result.data };
  }
  const start = async (cookie, phase = 'practice') => request('/api/tasks/start', { cookie, value: { phase } });
  const upload = (cookie, taskId, attemptId = randomUUID(), bytes = wav(), headers = {}) => request('/api/recordings', {
    cookie, method: 'POST', headers: { 'Content-Type': 'audio/wav', 'X-Task-Id': taskId, 'X-Attempt-Id': attemptId, 'X-Duration-Ms': '100', ...headers }, body: bytes
  });
  async function practiced(cookie) {
    const task = await start(cookie); assert.equal(task.status, 200);
    const result = await upload(cookie, task.data.taskId); assert.equal(result.status, 201); return result;
  }
  return { dataDir, request, login, start, upload, practiced, async restart(beforeOpen) { await app.close(); beforeOpen?.(); app = createApplication({ dataDir, config }); url = await app.listen(0); } };
}

test('códigos, origem e arquivos privados são protegidos', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('/api/state')).status, 401);
  assert.equal((await f.request('/api/session', { value: { code: 'INVALID' } })).status, 401);
  assert.equal((await f.request('/api/session', { value: { code: 'TEST-G01' }, headers: { Origin: 'https://outro.site' } })).status, 403);
  for (const route of ['/config.json', '/data/coleta.sqlite', '/data/audio/test.wav', '/server.mjs']) assert.equal((await f.request(route)).status, 404);
  const page = await f.request('/');
  assert.equal(page.status, 200); assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  const g = await f.login(); const n = await f.login('TEST-N01');
  assert.equal(g.state.condition, 'gamified'); assert.equal(n.state.goalSize, null);
  assert.equal(g.state.totalPhrases, 2); assert.equal(g.state.interfaceVersion, '0.4.0-ux');
});

test('familiarização é separada; sequência e tarefa iniciada são estáveis', async t => {
  const f = await fixture(t); const { cookie } = await f.login();
  assert.equal((await f.start(cookie, 'collection')).status, 409);
  const first = await f.start(cookie); const repeated = await f.start(cookie);
  assert.equal(first.data.taskId, repeated.data.taskId);
  const practice = await f.upload(cookie, first.data.taskId);
  assert.equal(practice.data.state.confirmedCount, 0); assert.equal(practice.data.state.practiceDone, true);
  assert.equal((await f.start(cookie)).status, 409);
  const taskA = await f.start(cookie, 'collection');
  assert.equal(taskA.data.phrase.id, 'a');
  await f.upload(cookie, taskA.data.taskId);
  const taskB = await f.start(cookie, 'collection'); assert.equal(taskB.data.phrase.id, 'b');
});

test('reenvio confirmado não duplica áudio nem contribuição; conflitos são rejeitados', async t => {
  const f = await fixture(t); const { cookie } = await f.login(); await f.practiced(cookie);
  const task = await f.start(cookie, 'collection'); const attempt = randomUUID();
  const sent = await f.upload(cookie, task.data.taskId, attempt);
  assert.equal(sent.status, 201); assert.equal(sent.data.state.confirmedCount, 1);
  const again = await f.upload(cookie, task.data.taskId, attempt);
  assert.equal(again.status, 200); assert.equal(again.data.duplicate, true);
  assert.equal(again.data.recordingId, sent.data.recordingId); assert.equal(again.data.state.confirmedCount, 1);
  assert.equal((await f.upload(cookie, task.data.taskId)).status, 409);
  const otherBytes = wav(); otherBytes[50] = 7;
  assert.equal((await f.upload(cookie, task.data.taskId, attempt, otherBytes)).status, 409);
  const taskB = await f.start(cookie, 'collection');
  assert.equal((await f.upload(cookie, taskB.data.taskId, attempt)).status, 409);
  assert.equal(readdirSync(path.join(f.dataDir, 'audio')).length, 2);
});

test('falhas de validação não avançam o fluxo e uma pessoa não envia pela outra', async t => {
  const f = await fixture(t); const g = await f.login(); const n = await f.login('TEST-N01');
  await f.practiced(g.cookie); const task = await f.start(g.cookie, 'collection');
  assert.equal((await f.upload(n.cookie, task.data.taskId)).status, 403);
  assert.equal((await f.upload(g.cookie, task.data.taskId, randomUUID(), Buffer.alloc(100))).status, 422);
  assert.equal((await f.upload(g.cookie, task.data.taskId, randomUUID(), wav(), { 'Content-Type': 'text/plain' })).status, 415);
  const current = await f.request('/api/state', { cookie: g.cookie });
  assert.equal(current.data.confirmedCount, 0); assert.equal(current.data.nextPhrase.id, 'a');
});

test('falha no armazenamento não gera sucesso, deixa o banco consistente e permite repetir', async t => {
  let fail = true;
  const f = await fixture(t, { beforeRecordingCommit() { if (fail) throw new Error('EIO simulado'); } });
  const { cookie } = await f.login(); const task = await f.start(cookie); const attempt = randomUUID();
  assert.equal((await f.upload(cookie, task.data.taskId, attempt)).status, 500);
  assert.equal(readdirSync(path.join(f.dataDir, 'audio')).length, 0);
  assert.equal((await f.request('/api/state', { cookie })).data.practiceDone, false);
  fail = false;
  assert.equal((await f.upload(cookie, task.data.taskId, attempt)).status, 201);
});

test('pausa, nova sessão e reinício do servidor preservam os envios e eventos atrasados', async t => {
  const f = await fixture(t); const logged = await f.login(); await f.practiced(logged.cookie);
  const task = await f.start(logged.cookie, 'collection'); await f.upload(logged.cookie, task.data.taskId);
  await f.request('/api/end', { cookie: logged.cookie, value: { reason: 'paused' } });
  assert.equal((await f.start(logged.cookie, 'collection')).status, 410);
  const next = await f.request('/api/resume', { cookie: logged.cookie, value: {} });
  const cookie = next.headers.get('set-cookie').split(';')[0];
  assert.notEqual(next.data.sessionId, logged.state.sessionId);
  const eventId = randomUUID();
  const event = { id: eventId, taskId: task.data.taskId, sessionId: logged.state.sessionId, type: 'recording_started', clientAt: new Date().toISOString() };
  assert.equal((await f.request('/api/events', { cookie, value: { events: [event] } })).status, 200);
  assert.equal((await f.request('/api/events', { cookie, value: { events: [event] } })).status, 200);
  await f.restart();
  const restored = await f.request('/api/state', { cookie });
  assert.equal(restored.data.confirmedCount, 1); assert.equal(restored.data.nextPhrase.id, 'b');
  const db = new DatabaseSync(path.join(f.dataDir, 'coleta.sqlite'), { readOnly: true });
  assert.equal(db.prepare('SELECT session_id FROM events WHERE id=?').get(eventId).session_id, logged.state.sessionId);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM events WHERE id=?').get(eventId).n, 1); db.close();
});

test('exportação inclui tarefas sem envio e separa treino, coleta, sessões e áudio', async t => {
  const f = await fixture(t); const { cookie } = await f.login(); await f.practiced(cookie);
  const task = await f.start(cookie, 'collection'); await f.upload(cookie, task.data.taskId);
  await f.start(cookie, 'collection');
  const out = path.join(f.dataDir, 'export');
  const result = spawnSync(process.execPath, ['exportar.mjs', '--out', out, '--include-audio'], { cwd: path.resolve(import.meta.dirname, '..'), env: { ...process.env, IC_DATA_DIR: f.dataDir }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(readFileSync(path.join(out, 'resumo.json'), 'utf8'));
  assert.deepEqual(summary.totals, { recordings: 2, collection: 1, practice: 1, sessions: 1, tasks: 3, evaluations: 0 });
  assert.equal(readdirSync(path.join(out, 'audio')).length, 2);
  assert.doesNotMatch(readFileSync(path.join(out, 'sessoes.csv'), 'utf8'), /token_hash|TEST-G01/);
  assert.match(readFileSync(path.join(out, 'gravacoes.csv'), 'utf8'), /reported_duration_ms/);
  for (const file of ['gravacoes.csv', 'eventos.csv', 'sessoes.csv']) assert.match(readFileSync(path.join(out, file), 'utf8'), /interface_version/);
});

test('migração preserva áudios e exige uma nova sessão para a interface atual', async t => {
  const f = await fixture(t); const logged = await f.login(); await f.practiced(logged.cookie);
  const task = await f.start(logged.cookie, 'collection'); await f.upload(logged.cookie, task.data.taskId);
  await f.restart(() => {
    const db = new DatabaseSync(path.join(f.dataDir, 'coleta.sqlite'));
    db.exec('ALTER TABLE sessions DROP COLUMN interface_version'); db.close();
  });
  const old = await f.request('/api/state', { cookie: logged.cookie });
  assert.equal(old.data.interfaceVersion, '0.1.0'); assert.equal(old.data.requiresResume, true);
  assert.equal(old.data.confirmedCount, 1);
  assert.equal((await f.start(logged.cookie, 'collection')).status, 409);
  assert.equal((await f.upload(logged.cookie, task.data.taskId)).status, 409);
  const resumed = await f.request('/api/resume', { cookie: logged.cookie, value: {} });
  assert.equal(resumed.data.interfaceVersion, '0.4.0-ux'); assert.equal(resumed.data.requiresResume, false);
  assert.equal(resumed.data.confirmedCount, 1); assert.equal(resumed.data.nextPhrase.id, 'b');
  assert.notEqual(resumed.data.sessionId, logged.state.sessionId);
  assert.equal(readdirSync(path.join(f.dataDir, 'audio')).length, 2);
  const db = new DatabaseSync(path.join(f.dataDir, 'coleta.sqlite'), { readOnly: true });
  assert.equal(db.prepare('SELECT interface_version FROM sessions WHERE id=?').get(logged.state.sessionId).interface_version, '0.1.0'); db.close();
});

test('imagens cobrem as onze frases, são locais e iguais nas duas condições', async t => {
  const base = path.resolve(import.meta.dirname, '..');
  const actualConfig = JSON.parse(readFileSync(path.join(base, 'config.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(path.join(base, 'phrase-images.json'), 'utf8'));
  const f = await fixture(t, { config: actualConfig });
  for (const phrase of [actualConfig.practicePhrase, ...actualConfig.phrases]) {
    const image = manifest.images.find(image => image.phraseId === phrase.id && image.text === phrase.text);
    assert.ok(image, `Sem imagem para ${phrase.id}`);
    const bytes = readFileSync(path.join(base, 'public', 'assets', 'phrases', image.file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), image.sha256);
    const response = await f.request(`/assets/phrases/${image.file}`);
    assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/webp');
  }
  for (const route of ['/phrase-images.json', '/assets/phrases/phrase-images.json', '/assets/phrases/arquivo-desconhecido.webp']) assert.equal((await f.request(route)).status, 404);
  const g = await f.login('TESTE-G01'); const n = await f.login('TESTE-N01');
  assert.deepEqual((await f.start(g.cookie)).data.phrase.image, (await f.start(n.cookie)).data.phrase.image);
  await f.practiced(g.cookie); await f.practiced(n.cookie);
  const gameTask = await f.start(g.cookie, 'collection'); const neutralTask = await f.start(n.cookie, 'collection');
  assert.deepEqual(gameTask.data.phrase.image, neutralTask.data.phrase.image);
  assert.equal(gameTask.data.phrase.image.src, '/assets/phrases/teste-01.webp');
  assert.equal(gameTask.data.phrase.image.alt, '', 'A frase adjacente já comunica o conteúdo da cena');
  // O mesmo identificador com outro texto não deve herdar uma cena incorreta.
  const changed = structuredClone(actualConfig); changed.phrases[0].text = 'Outra frase de teste.';
  const other = await fixture(t, { config: changed }); const participant = await other.login('TESTE-G01');
  await other.practiced(participant.cookie);
  assert.equal((await other.start(participant.cookie, 'collection')).data.phrase.image, undefined);
});

test('configuração não altera silenciosamente banco ou condição já usados', async t => {
  const f = await fixture(t); await f.login();
  assert.throws(() => createApplication({ dataDir: f.dataDir, config: { ...config, phrases: [{ id: 'a', text: 'Alterada.' }] } }), /bankVersion/);
  assert.throws(() => createApplication({ dataDir: f.dataDir, config: { ...config, participants: [{ id: 'g', code: 'TEST-G01', condition: 'neutral' }] } }), /condição/);
});

test('avaliação valida respostas e autoria, aceita sessão pausada e atualiza sem duplicar', async t => {
  const f = await fixture(t); const g = await f.login(); const n = await f.login('TEST-N01');
  const answer = { sessionId: g.state.sessionId, ease: 4, gamefulness: 5, fatigue: 2, images: 'helped', comment: 'Uma frase de cada vez.' };
  assert.equal((await f.request('/api/evaluation', { value: answer })).status, 401);
  assert.equal((await f.request('/api/evaluation', { cookie: n.cookie, value: answer })).status, 403);
  for (const values of [{ ease: 0 }, { fatigue: 6 }, { gamefulness: '3' }, { images: 'unknown' }, { comment: 'a'.repeat(1001) }]) {
    assert.equal((await f.request('/api/evaluation', { cookie: g.cookie, value: { ...answer, ...values } })).status, 400);
  }
  assert.equal((await f.request('/api/evaluation', { cookie: g.cookie, value: { sessionId: g.state.sessionId } })).status, 400);
  await f.request('/api/end', { cookie: g.cookie, value: { reason: 'paused' } });
  const saved = await f.request('/api/evaluation', { cookie: g.cookie, value: answer });
  assert.equal(saved.status, 200); assert.equal(saved.data.evaluation.questionnaire_version, 'ux-exploratorio-v1');
  const resumed = await f.request('/api/resume', { cookie: g.cookie, value: {} });
  const cookie = resumed.headers.get('set-cookie').split(';')[0];
  assert.equal(resumed.data.evaluation, null);
  const updated = await f.request('/api/evaluation', { cookie, value: { ...answer, ease: null, fatigue: 3 } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.evaluation.session_id, g.state.sessionId);
  assert.equal(updated.data.evaluation.responded_at, saved.data.evaluation.responded_at);
  const db = new DatabaseSync(path.join(f.dataDir, 'coleta.sqlite'), { readOnly: true });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM evaluations').get().n, 1);
  assert.equal(db.prepare('SELECT ease FROM evaluations').get().ease, null); db.close();
  assert.equal((await f.request('/api/state', { cookie })).data.confirmedCount, 0);
});

test('exportação preserva dimensões independentes, omissões e versão; protege comentário na planilha', async t => {
  const f = await fixture(t); const g = await f.login();
  await f.request('/api/evaluation', { cookie: g.cookie, value: { sessionId: g.state.sessionId, ease: 4, fatigue: 2, comment: '=1+1' } });
  const out = path.join(f.dataDir, 'export-evaluation');
  const run = () => spawnSync(process.execPath, ['exportar.mjs', '--out', out], { cwd: path.resolve(import.meta.dirname, '..'), env: { ...process.env, IC_DATA_DIR: f.dataDir }, encoding: 'utf8' });
  const result = run(); assert.equal(result.status, 0, result.stderr);
  const csv = readFileSync(path.join(out, 'avaliacoes.csv'), 'utf8');
  assert.match(csv, /ease.*gamefulness.*fatigue/);
  assert.match(csv, /"4","","2"/);
  assert.match(csv, /ux-exploratorio-v1/); assert.ok(csv.includes("\"'=1+1\""));
  assert.equal(JSON.parse(readFileSync(path.join(out, 'resumo.json'), 'utf8')).totals.evaluations, 1);
  await f.restart(() => {
    const db = new DatabaseSync(path.join(f.dataDir, 'coleta.sqlite')); db.exec('DROP TABLE evaluations'); db.close();
    const legacy = run(); assert.equal(legacy.status, 0, legacy.stderr);
    assert.equal(JSON.parse(readFileSync(path.join(out, 'resumo.json'), 'utf8')).totals.evaluations, 0);
  });
});
