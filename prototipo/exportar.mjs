import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(process.env.IC_DATA_DIR ?? path.join(here, 'data'));
const argument = process.argv.indexOf('--out');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.resolve(argument >= 0 ? process.argv[argument + 1] ?? '' : path.join(here, 'exportacoes', stamp));
if (argument >= 0 && !process.argv[argument + 1]) throw new Error('Informe o diretório após --out.');
if (!existsSync(path.join(dataDir, 'coleta.sqlite'))) {
  console.error('Ainda não há dados para exportar. Inicie o protótipo e conclua um envio de teste.');
  process.exitCode = 1;
} else {
  const db = new DatabaseSync(path.join(dataDir, 'coleta.sqlite'), { readOnly: true });
  try {
    const recordings = db.prepare(`SELECT p.id AS participant_id, p.condition, p.data_kind,
      r.session_id, s.interface_version, t.id AS task_id, r.attempt_id, r.id AS recording_id,
      t.phase, t.bank_version, t.phrase_id, t.phrase_text AS prompt_text, t.domain,
      t.started_at AS task_started_at, r.confirmed_at, r.duration_ms AS reported_duration_ms,
      r.mime_type, r.byte_length, r.audio_path, r.sha256
      FROM recordings r JOIN tasks t ON t.id=r.task_id JOIN sessions s ON s.id=r.session_id
      JOIN participants p ON p.id=t.participant_id ORDER BY r.confirmed_at`).all();
    const events = db.prepare(`SELECT e.id AS event_id, p.id AS participant_id, p.condition, p.data_kind,
      e.session_id, s.bank_version, s.interface_version, e.task_id, t.phase, e.type, e.server_at, e.client_at, e.detail
      FROM events e JOIN sessions s ON s.id=e.session_id JOIN participants p ON p.id=s.participant_id
      LEFT JOIN tasks t ON t.id=e.task_id ORDER BY e.server_at`).all();
    const sessions = db.prepare(`SELECT s.id AS session_id, s.participant_id, p.condition, p.data_kind,
      s.bank_version, s.goal_size, s.interface_version, s.started_at, s.ended_at, s.end_reason FROM sessions s JOIN participants p ON p.id=s.participant_id ORDER BY s.started_at`).all();
    const tasks = db.prepare(`SELECT t.id AS task_id, t.participant_id, p.condition, p.data_kind,
      t.bank_version, t.phrase_id, t.phase, t.started_at, t.confirmed_at
      FROM tasks t JOIN participants p ON p.id=t.participant_id ORDER BY t.started_at`).all();
    const evaluations = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='evaluations'").get()
      ? db.prepare(`SELECT s.participant_id,p.condition,p.data_kind,e.session_id,s.bank_version,s.interface_version,
        e.questionnaire_version,e.ease,e.gamefulness,e.fatigue,e.images,e.comment,e.responded_at,e.updated_at
        FROM evaluations e JOIN sessions s ON s.id=e.session_id JOIN participants p ON p.id=s.participant_id ORDER BY e.responded_at`).all() : [];
    const defaultColumns = {
      gravacoes: ['participant_id','condition','data_kind','session_id','interface_version','task_id','attempt_id','recording_id','phase','bank_version','phrase_id','prompt_text','domain','task_started_at','confirmed_at','reported_duration_ms','mime_type','byte_length','audio_path','sha256'],
      eventos: ['event_id','participant_id','condition','data_kind','session_id','bank_version','interface_version','task_id','phase','type','server_at','client_at','detail'],
      sessoes: ['session_id','participant_id','condition','data_kind','bank_version','goal_size','interface_version','started_at','ended_at','end_reason'],
      tarefas: ['task_id','participant_id','condition','data_kind','bank_version','phrase_id','phase','started_at','confirmed_at'],
      avaliacoes: ['participant_id','condition','data_kind','session_id','bank_version','interface_version','questionnaire_version','ease','gamefulness','fatigue','images','comment','responded_at','updated_at']
    };
    mkdirSync(output, { recursive: true });
    for (const [name, rows] of Object.entries({ gravacoes: recordings, eventos: events, sessoes: sessions, tarefas: tasks, avaliacoes: evaluations })) {
      const columns = defaultColumns[name];
      const escape = value => {
        let text = String(value ?? '');
        if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
        return `"${text.replaceAll('"', '""')}"`;
      };
      writeFileSync(path.join(output, `${name}.csv`), '\uFEFF' + [columns.map(escape).join(','), ...rows.map(row => columns.map(key => escape(row[key])).join(','))].join('\r\n') + '\r\n', 'utf8');
    }
    const missingAudio = recordings.filter(row => !existsSync(path.join(dataDir, row.audio_path))).map(row => row.recording_id);
    const summary = {
      exportedAt: new Date().toISOString(), dataKind: 'technical',
      notes: ['Gravações de familiarização têm phase=practice; a coleta tem phase=collection.', 'reported_duration_ms é o tempo informado pelo navegador, não duração validada por decodificação.', 'Os arquivos mantêm o formato produzido pelo navegador; não há conversão de codec ou avaliação de pronúncia.', 'Inícios/fins de sessão refletem ações registradas; fechar uma aba não garante evento de encerramento.'],
      totals: { recordings: recordings.length, collection: recordings.filter(r => r.phase === 'collection').length, practice: recordings.filter(r => r.phase === 'practice').length, sessions: sessions.length, tasks: tasks.length, evaluations: evaluations.length },
      evaluationNotes: ['Questionário exploratório opcional; não é UEQ-S, GAMEFULQUEST ou escala de motivação intrínseca validada.', 'ease, gamefulness e fatigue são respostas independentes de 1 a 5; campos vazios indicam ausência de resposta. Não há escore combinado.', 'Uma resposta por sessão; uma atualização substitui os valores, preservando responded_at e alterando updated_at.'],
      missingAudio
    };
    writeFileSync(path.join(output, 'resumo.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
    if (process.argv.includes('--include-audio')) {
      mkdirSync(path.join(output, 'audio'), { recursive: true });
      for (const row of recordings) if (existsSync(path.join(dataDir, row.audio_path))) copyFileSync(path.join(dataDir, row.audio_path), path.join(output, row.audio_path));
    }
    console.log(`Exportação concluída: ${output}\n${recordings.length} gravações (${summary.totals.collection} de coleta, ${summary.totals.practice} de familiarização).`);
    if (missingAudio.length) console.error(`Atenção: ${missingAudio.length} arquivos de áudio não foram localizados. Consulte resumo.json.`);
  } finally { db.close(); }
}
