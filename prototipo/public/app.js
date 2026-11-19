const $ = id => document.getElementById(id);
let state = null;
let task = null;
let mode = 'idle';
let draft = null;
let recorder = null;
let stream = null;
let audioUrl = null;
let ticker = null;
let recordingStart = 0;
let recordingGeneration = 0;
let stopWaiter = null;
let sendingFailed = false;
let savingDraft = false;
let eventQueue = [];
let flushing = null;
let screen = 'welcome';
let submittingEvaluation = false;

const time = milliseconds => {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};
const show = (id, visible) => { $(id).hidden = !visible; };
const announce = text => { $('live-message').textContent = text; };
const error = text => { $('recording-error').textContent = text; show('recording-error', Boolean(text)); };
const globalError = text => { $('global-error').textContent = text; show('global-error', Boolean(text)); };

async function api(route, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? 20000);
  try {
    const response = await fetch(`/api/${route}`, { credentials: 'same-origin', ...options, signal: controller.signal });
    const result = await response.json();
    if (!response.ok) {
      const failure = new Error(result.error ?? 'Não foi possível concluir a ação.');
      failure.status = response.status;
      throw failure;
    }
    return result;
  } catch (failure) {
    if (failure.name === 'AbortError') throw new Error('A conexão demorou. Tente novamente; o envio só será contado após a confirmação.');
    if (failure instanceof TypeError) throw new Error('Não foi possível conectar. Confira a conexão e tente novamente.');
    throw failure;
  } finally { clearTimeout(timeout); }
}
const post = (route, value = {}) => api(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });

let databasePromise;
function draftDatabase() {
  databasePromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('ic-voice-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  return databasePromise;
}
async function draftStore(action, value) {
  const db = await draftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', action === 'get' ? 'readonly' : 'readwrite');
    const store = transaction.objectStore('drafts');
    const request = action === 'get' ? store.get(state.participantId) : action === 'put' ? store.put(value, state.participantId) : store.delete(state.participantId);
    let result;
    request.onsuccess = () => { result = request.result; };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function loadEvents() {
  try { eventQueue = JSON.parse(localStorage.getItem(`ic-events-${state.participantId}`) ?? '[]'); }
  catch { eventQueue = []; }
  if (!Array.isArray(eventQueue)) eventQueue = [];
}
function storeEvents() {
  try { localStorage.setItem(`ic-events-${state.participantId}`, JSON.stringify(eventQueue)); }
  catch { show('sync-warning', true); }
}
function track(type, reason) {
  if (!state || !task) return;
  eventQueue.push({ id: crypto.randomUUID(), taskId: task.taskId, sessionId: state.sessionId, type, reason, clientAt: new Date().toISOString() });
  storeEvents();
  void flushEvents();
}
async function flushEvents() {
  if (!state || !eventQueue.length) return true;
  if (flushing) return flushing;
  flushing = (async () => {
    try {
      while (eventQueue.length) {
        const batch = eventQueue.slice(0, 10);
        await post('events', { events: batch });
        const sent = new Set(batch.map(e => e.id));
        eventQueue = eventQueue.filter(e => !sent.has(e.id));
        storeEvents();
      }
      show('sync-warning', false);
      return true;
    } catch { show('sync-warning', true); return false; }
    finally { flushing = null; }
  })();
  return flushing;
}

function setScreen(name) {
  screen = name;
  for (const candidate of ['welcome', 'collect', 'summary']) show(`${candidate}-screen`, candidate === name);
  const heading = $(`${name === 'collect' ? 'collect' : name}-title`);
  heading.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function returnToLogin() {
  recordingGeneration++; stopTracks();
  state = null; task = null; draft = null; eventQueue = []; mode = 'idle';
  setAudio(null); show('resume-panel', false); show('login-form', true); show('sync-warning', false);
  setScreen('welcome'); $('access-code').focus();
}
function setAudio(blob) {
  const audio = $('audio-preview');
  audio.pause();
  audio.removeAttribute('src');
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = blob ? URL.createObjectURL(blob) : null;
  if (audioUrl) audio.src = audioUrl;
  audio.load();
}
function stopTracks() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  clearInterval(ticker);
  ticker = null;
}
function renderPhrase(phrase) {
  $('phrase-text').textContent = phrase.text;
  const image = $('phrase-image');
  image.removeAttribute('src');
  image.alt = phrase.image?.alt ?? '';
  show('phrase-image', Boolean(phrase.image));
  $('phrase-prompt').classList.toggle('has-illustration', Boolean(phrase.image));
  if (phrase.image) {
    image.width = phrase.image.width;
    image.height = phrase.image.height;
    image.src = phrase.image.src;
  }
}
function missionProgress(confirmed = mode === 'confirmed') {
  const count = state.confirmedCount;
  const size = state.goalSize;
  const total = state.totalPhrases;
  const missions = Math.ceil(total / size);
  const index = Math.min(missions - 1, Math.floor(Math.max(0, count - (confirmed ? 1 : 0)) / size));
  const target = Math.min(size, total - index * size);
  const part = Math.min(target, count - index * size);
  const completed = count === total ? missions : Math.floor(count / size);
  return { count, size, total, missions, index, target, part, completed, complete: part === target };
}
function renderGoal(message) {
  const visible = state?.condition === 'gamified' && task?.phase === 'collection';
  show('goal-panel', visible);
  $('collect-screen').classList.toggle('is-gamified', visible);
  if (!visible) return;
  const m = missionProgress();
  $('goal-title').textContent = `Missão ${m.index + 1}`;
  $('goal-count').textContent = `${m.part} de ${m.target} gravações`;
  $('goal-progress').max = m.target;
  $('goal-progress').value = m.part;
  $('goal-progress').setAttribute('aria-label', `Progresso da missão ${m.index + 1}`);
  renderMissionPath(m);
  $('motivation-message').textContent = message ?? (m.complete ? 'Missão concluída! Escolha continuar ou pausar.' : m.part ? `Falta${m.target - m.part === 1 ? '' : 'm'} ${m.target - m.part} para concluir esta missão. No seu ritmo.` : 'Um passo de cada vez, no seu ritmo.');
}
function renderMissionPath(m) {
  $('mission-path').replaceChildren(...Array.from({ length: m.missions }, (_, index) => {
    const done = index < m.completed;
    const current = index === m.index;
    const item = document.createElement('li');
    item.className = `mission-step${done ? ' is-complete' : ''}${current ? ' is-current' : ''}`;
    if (current) item.setAttribute('aria-current', 'step');
    const node = document.createElement('span');
    node.className = 'mission-node'; node.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', done ? '#check' : current ? '#mic' : '#flag');
    svg.append(use); node.append(svg);
    const label = document.createElement('strong'); label.textContent = `Missão ${index + 1}`;
    const status = document.createElement('span'); status.className = 'mission-status';
    status.textContent = done ? 'Concluída' : current ? 'Em andamento' : 'A seguir';
    item.append(node, label, status); return item;
  }));
}
function missionIntro() {
  const m = missionProgress(false);
  task = null; mode = 'idle'; setAudio(null);
  $('collect-screen').classList.add('is-gamified');
  show('goal-panel', false); show('recording-surface', false); show('collection-help', false); show('mission-intro', true);
  $('collect-title').textContent = 'Seu caminho de contribuições';
  $('phase-description').textContent = 'Uma missão de cada vez, com pausas quando precisar.';
  $('intro-title').textContent = `Missão ${m.index + 1}`;
  $('intro-objective').textContent = m.part ? `Você já enviou ${m.part} de ${m.target} gravações nesta missão.` : `Objetivo: gravar e enviar ${m.target} frases.`;
  $('intro-mission-total').textContent = `${m.completed} de ${m.missions} missões concluídas neste material de teste.`;
  $('mission-start-button').textContent = `${m.part ? 'Continuar' : 'Começar'} missão ${m.index + 1}`;
  $('pause-button').disabled = false;
  renderMissionPath(m); setScreen('collect');
}
function renderRecorder() {
  const busy = ['requesting', 'uploading'].includes(mode) || savingDraft;
  const recording = mode === 'recording';
  const review = ['review', 'uploading'].includes(mode);
  show('record-button', ['idle', 'requesting', 'recording'].includes(mode));
  $('record-button').disabled = mode === 'requesting' || savingDraft;
  $('record-button').classList.toggle('recording', recording);
  $('record-label').textContent = recording ? 'Parar gravação' : mode === 'requesting' ? 'Aguardando o microfone…' : 'Começar gravação';
  $('record-icon').setAttribute('href', recording ? '#stop' : '#mic');
  $('state-dot').className = `state-dot${recording ? ' recording' : mode === 'confirmed' ? ' confirmed' : ''}`;
  const labels = { idle: 'Pronto para gravar', requesting: 'Permita o uso do microfone no navegador', recording: 'Gravando sua voz', review: 'Gravação pronta para ouvir e enviar', uploading: 'Enviando. Aguarde a confirmação.', confirmed: 'Envio confirmado' };
  $('recorder-status').textContent = savingDraft ? 'Guardando a gravação neste navegador…' : labels[mode];
  show('review-controls', review);
  show('confirmed-panel', mode === 'confirmed');
  const celebrate = mode === 'confirmed' && state?.condition === 'gamified' && task?.phase === 'collection' && missionProgress().complete;
  show('mission-celebration', celebrate);
  if (celebrate) {
    const m = missionProgress();
    $('celebration-title').textContent = `Missão ${m.index + 1} concluída!`;
    $('celebration-detail').textContent = `${m.target} gravações enviadas e salvas. ${m.count === m.total ? 'Você concluiu todas as missões deste teste!' : 'Uma nova missão está pronta quando você quiser continuar.'}`;
  }
  $('send-button').disabled = busy;
  $('send-button').textContent = mode === 'uploading' ? 'Enviando…' : sendingFailed ? 'Tentar envio novamente' : 'Enviar gravação';
  $('rerecord-button').disabled = busy;
  $('pause-button').disabled = mode === 'uploading' || savingDraft;
  $('confirmed-pause-button').disabled = mode === 'uploading' || savingDraft;
  $('collect-screen').setAttribute('aria-busy', String(mode === 'uploading'));
  show('draft-notice', Boolean(draft?.persisted) && mode !== 'confirmed');
  if (draft) {
    $('timer').textContent = time(draft.durationMs);
    $('recording-length').textContent = `Duração: ${time(draft.durationMs)}. Você pode ouvir antes de enviar.`;
  }
}

async function acceptState(value) {
  state = value;
  loadEvents();
  try {
    const saved = await draftStore('get');
    if (saved && saved.bankVersion === state.bankVersion && !state.confirmedTaskIds.includes(saved.task.taskId)) draft = { ...saved, persisted: true };
    else {
      draft = null;
      if (saved) await draftStore('delete');
    }
  } catch { draft = null; }
  show('login-form', false);
  show('resume-panel', true);
  const gameWelcome = state.condition === 'gamified' && state.practiceDone;
  show('welcome-mission', gameWelcome);
  if (gameWelcome) {
    const m = missionProgress(false);
    $('welcome-mission-title').textContent = m.count === m.total ? 'Jornada de teste concluída!' : `Sua próxima missão: ${m.index + 1}`;
    $('welcome-mission-detail').textContent = m.count === m.total ? `${m.missions} missões concluídas. Obrigada por contribuir!` : `${m.part} de ${m.target} gravações nesta missão. Continue no seu ritmo.`;
  }
  $('resume-message').textContent = draft ? 'Há uma gravação guardada para você retomar.' : !state.practiceDone ? 'Primeiro, vamos testar o gravador com uma frase de familiarização.' : !state.nextPhrase ? 'Você já enviou todas as frases deste material.' : 'Seu código foi reconhecido. Você pode continuar de onde parou.';
  $('begin-button').textContent = draft ? 'Retomar gravação' : !state.practiceDone ? 'Testar o gravador' : !state.nextPhrase ? 'Ver resumo' : 'Continuar coleta';
  void flushEvents();
}

async function begin({ skipIntro = false } = {}) {
  if (submittingEvaluation) return;
  globalError(''); error('');
  $('begin-button').disabled = true;
  $('continue-button').disabled = true;
  $('mission-start-button').disabled = true;
  try {
    if (state.paused || state.requiresResume) state = await post('resume');
    else state = await api('state');
    if (state.requiresResume) state = await post('resume');
    if (draft && state.confirmedTaskIds.includes(draft.task.taskId)) { draft = null; await draftStore('delete').catch(() => {}); }
    if (!state.nextPhrase && state.practiceDone && !draft) { await finish('completed'); return; }
    if (!skipIntro && !draft && state.condition === 'gamified' && state.practiceDone && (screen !== 'collect' || state.confirmedCount % state.goalSize === 0)) { missionIntro(); return; }
    const phase = draft?.task.phase ?? (state.practiceDone ? 'collection' : 'practice');
    const result = await post('tasks/start', { phase });
    task = result;
    state = result.state;
    show('mission-intro', false); show('recording-surface', true); show('collection-help', true);
    if (draft?.task.taskId === task.taskId) {
      setAudio(draft.blob); mode = 'review';
    } else { draft = null; setAudio(null); mode = 'idle'; }
    sendingFailed = false;
    renderPhrase(task.phrase);
    $('collect-title').textContent = phase === 'practice' ? 'Vamos testar o gravador' : 'Grave a frase abaixo';
    $('phase-description').textContent = phase === 'practice' ? 'Esta frase é de familiarização e fica separada da coleta.' : 'Leia a frase no seu ritmo. Você pode gravar novamente.';
    $('timer').textContent = draft ? time(draft.durationMs) : '00:00';
    renderGoal(); renderRecorder(); setScreen('collect');
    announce(draft ? 'Gravação recuperada. Você pode ouvir e enviar.' : `${$('collect-title').textContent}. ${task.phrase.text}`);
  } catch (failure) {
    if (failure.status === 401 && (!draft || draft.persisted)) returnToLogin();
    globalError(failure.message);
  }
  finally { $('begin-button').disabled = false; $('continue-button').disabled = false; $('mission-start-button').disabled = false; }
}

function microphoneMessage(failure) {
  if (['NotAllowedError', 'SecurityError'].includes(failure.name)) return 'O acesso ao microfone foi bloqueado. Permita o microfone nas configurações deste site no navegador e tente novamente.';
  if (failure.name === 'NotFoundError') return 'Nenhum microfone foi encontrado. Conecte ou ative um microfone e tente novamente.';
  if (failure.name === 'NotReadableError') return 'Não foi possível usar o microfone. Confira se outro aplicativo está usando o dispositivo e tente novamente.';
  return 'Não foi possível começar a gravação. Confira o microfone e tente novamente.';
}

async function startRecording() {
  if (!['idle', 'review'].includes(mode)) return;
  error('');
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    error('A gravação não está disponível aqui. Abra pelo endereço localhost neste computador, ou use uma conexão HTTPS em um navegador com suporte à gravação.'); return;
  }
  const generation = ++recordingGeneration;
  const previousMode = mode;
  mode = 'requesting'; renderRecorder();
  try {
    const obtained = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (generation !== recordingGeneration || screen !== 'collect') { obtained.getTracks().forEach(track => track.stop()); return; }
    stream = obtained;
    const supported = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find(mime => MediaRecorder.isTypeSupported(mime));
    const instance = new MediaRecorder(stream, supported ? { mimeType: supported } : undefined);
    const chunks = [];
    let stoppedAt = 0;
    instance.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    instance.onerror = event => {
      error('A gravação foi interrompida pelo navegador. Tente gravar novamente.');
      track('microphone_error', event.error?.name ?? 'recording_error');
      if (instance.state !== 'inactive') instance.stop();
    };
    instance.onstop = async () => {
      const durationMs = Math.max(1, stoppedAt || performance.now() - recordingStart);
      stopTracks();
      const blob = new Blob(chunks, { type: instance.mimeType || chunks[0]?.type || 'audio/webm' });
      if (blob.size < 16) {
        mode = previousMode === 'review' && draft ? 'review' : 'idle';
        error('A gravação ficou vazia. Tente gravar novamente.');
        renderRecorder(); stopWaiter?.(); stopWaiter = null; return;
      }
      draft = { blob, durationMs, task: { taskId: task.taskId, phase: task.phase, phrase: task.phrase }, attemptId: crypto.randomUUID(), bankVersion: state.bankVersion, persisted: false };
      mode = 'review'; savingDraft = true; setAudio(blob); renderRecorder();
      try { await draftStore('put', { ...draft, persisted: undefined }); draft.persisted = true; }
      catch { error('A gravação está disponível nesta aba, mas não foi possível guardá-la no navegador. Envie antes de fechar a página.'); }
      savingDraft = false; sendingFailed = false;
      track('recording_stopped'); renderRecorder();
      announce('Gravação pronta. Você pode ouvir, gravar novamente ou enviar.');
      if (screen === 'collect') $('audio-preview').focus({ preventScroll: true });
      stopWaiter?.(); stopWaiter = null;
    };
    recorder = instance;
    instance.start();
    if (previousMode === 'review') track('rerecorded');
    track('recording_started');
    recordingStart = performance.now();
    mode = 'recording';
    $('audio-preview').pause();
    $('timer').textContent = '00:00';
    renderRecorder();
    ticker = setInterval(() => { $('timer').textContent = time(performance.now() - recordingStart); }, 250);
    recorder.captureStopTime = () => { stoppedAt = performance.now() - recordingStart; };
    announce('Gravando. Use Parar gravação quando terminar.');
  } catch (failure) {
    stopTracks();
    if (generation !== recordingGeneration) return;
    mode = previousMode;
    track('microphone_error', failure.name);
    error(microphoneMessage(failure)); renderRecorder();
  }
}

function stopRecording() {
  if (!recorder || recorder.state === 'inactive') return Promise.resolve();
  return new Promise(resolve => { stopWaiter = resolve; recorder.captureStopTime?.(); recorder.stop(); });
}

async function upload() {
  if (!draft || mode !== 'review' || savingDraft) return;
  error(''); mode = 'uploading'; renderRecorder();
  $('audio-preview').pause();
  try {
    await flushEvents();
    const response = await api('recordings', {
      method: 'POST', timeout: 60000,
      headers: { 'Content-Type': draft.blob.type || 'audio/webm', 'X-Task-Id': draft.task.taskId, 'X-Attempt-Id': draft.attemptId, 'X-Duration-Ms': String(draft.durationMs) },
      body: draft.blob
    });
    if (!response.confirmed) throw new Error('O recebimento ainda não foi confirmado. Tente novamente.');
    state = response.state;
    await draftStore('delete').catch(() => {});
    draft = null;
    mode = 'confirmed';
    const final = task.phase === 'collection' && !state.nextPhrase;
    const game = state.condition === 'gamified' && task.phase === 'collection';
    $('next-button').textContent = task.phase === 'practice' ? 'Começar coleta' : final ? 'Ver resumo' : game && missionProgress().complete ? 'Próxima missão' : 'Próxima frase';
    $('confirmed-next-step').textContent = task.phase === 'practice' ? 'O teste do gravador terminou. Você pode começar a coleta ou pausar.' : final ? 'Você concluiu este material de teste. Confira seus envios no resumo.' : game && missionProgress().complete ? 'A próxima missão está pronta. Você pode começar quando quiser.' : 'Quando quiser, siga para a próxima frase ou faça uma pausa.';
    show('confirmed-pause-button', !final);
    renderGoal();
    renderRecorder();
    announce(game && missionProgress().complete ? `Áudio recebido e salvo. Missão ${missionProgress().index + 1} concluída!` : 'Áudio recebido e salvo.');
    if (game && missionProgress().complete) $('mission-celebration').scrollIntoView({ block: 'center', behavior: 'instant' });
    $('next-button').focus({ preventScroll: true });
  } catch (failure) {
    mode = 'review'; sendingFailed = true;
    track('send_failed', String(failure.status ?? 'connection_error'));
    if (failure.status === 401 && draft?.persisted) {
      returnToLogin();
      globalError('Entre novamente com o mesmo código. Sua gravação ficou guardada neste navegador.');
      return;
    }
    error(`${failure.message} A gravação continua disponível para tentar novamente.`);
    renderRecorder();
  }
}

async function finish(reason = 'paused') {
  if (!state) return;
  error(''); globalError('');
  $('pause-button').disabled = true;
  try {
    if (mode === 'requesting') { recordingGeneration++; mode = draft ? 'review' : 'idle'; }
    if (mode === 'recording') await stopRecording();
    stopTracks(); $('audio-preview').pause();
    await flushEvents();
    state = await post('end', { reason });
    $('summary-title').textContent = draft && !draft.persisted ? 'Sua gravação está nesta aba.' : draft ? 'Você pode retomar depois.' : state.confirmedCount ? 'Tudo salvo por aqui.' : 'Sua sessão está pausada.';
    $('summary-description').textContent = draft && !draft.persisted ? 'Não foi possível guardar a gravação no navegador. Mantenha esta aba aberta e use Retomar para enviar.' : !state.nextPhrase && state.practiceDone ? 'Você enviou todas as frases deste material de teste.' : 'Seus envios confirmados ficam salvos. Use o mesmo código para continuar depois.';
    $('summary-count').textContent = String(state.confirmedCount);
    $('summary-duration').textContent = time(state.durationMs);
    const gameSummary = state.condition === 'gamified' && state.practiceDone;
    show('summary-missions', gameSummary);
    if (gameSummary) {
      const m = missionProgress(false);
      $('summary-missions-text').textContent = `${m.completed} de ${m.missions} missões concluídas.${m.count === m.total ? ' Jornada de teste concluída!' : ' Seu progresso continua aqui quando você voltar.'}`;
    }
    show('summary-draft', Boolean(draft));
    $('summary-draft').textContent = draft?.persisted ? 'Você também tem uma gravação ainda não enviada, guardada neste navegador.' : 'A gravação ainda não enviada será perdida se esta aba for fechada.';
    show('continue-button', Boolean(state.nextPhrase || draft || !state.practiceDone));
    renderEvaluation();
    setScreen('summary');
    announce(reason === 'completed' ? 'Material concluído. Os envios confirmados estão salvos.' : 'Sessão pausada. Os envios confirmados estão salvos.');
  } catch (failure) { globalError(failure.message); renderRecorder(); }
  finally { $('pause-button').disabled = false; }
}

async function logout() {
  if (submittingEvaluation) return;
  globalError('');
  if (draft && !draft.persisted && !window.confirm('Esta gravação ainda não foi enviada e será descartada ao voltar ao início. Deseja continuar?')) return;
  try {
    await flushEvents();
    await post('logout');
    returnToLogin();
    $('access-code').value = ''; show('login-error', false);
    setScreen('welcome'); $('access-code').focus();
  } catch (failure) { globalError(failure.message); }
}

const evaluationKeys = ['ease', 'gamefulness', 'fatigue', 'images', 'comment'];
function renderEvaluation() {
  const saved = state.evaluation;
  for (const key of evaluationKeys) $(`evaluation-${key}`).value = saved?.[key] ?? '';
  $('evaluation-panel').open = false;
  show('evaluation-error', false);
  show('evaluation-status', Boolean(saved));
  $('evaluation-status').textContent = saved ? 'Suas respostas desta sessão estão salvas. Você pode atualizá-las.' : '';
  $('evaluation-submit').textContent = saved ? 'Atualizar respostas' : 'Enviar respostas';
}
async function saveEvaluation(event) {
  event.preventDefault();
  if (!state || submittingEvaluation) return;
  show('evaluation-error', false); show('evaluation-status', false);
  const values = { sessionId: state.sessionId };
  for (const key of evaluationKeys) {
    const value = $(`evaluation-${key}`).value;
    values[key] = ['ease','gamefulness','fatigue'].includes(key) ? (value ? Number(value) : null) : key === 'comment' ? value.trim() : value || null;
  }
  submittingEvaluation = true;
  for (const control of $('evaluation-form').querySelectorAll('select,textarea,button')) control.disabled = true;
  $('continue-button').disabled = true; $('exit-button').disabled = true;
  $('evaluation-submit').textContent = 'Enviando…';
  try {
    const result = await post('evaluation', values);
    state.evaluation = result.evaluation;
    $('evaluation-status').textContent = 'Respostas recebidas e salvas. Obrigada por compartilhar sua experiência.';
    show('evaluation-status', true); $('evaluation-status').focus({ preventScroll: true });
  } catch (failure) {
    $('evaluation-error').textContent = `${failure.message} Suas respostas continuam no formulário para tentar novamente.`;
    show('evaluation-error', true);
  } finally {
    submittingEvaluation = false;
    for (const control of $('evaluation-form').querySelectorAll('select,textarea,button')) control.disabled = false;
    $('continue-button').disabled = false; $('exit-button').disabled = false;
    $('evaluation-submit').textContent = state.evaluation ? 'Atualizar respostas' : 'Enviar respostas';
  }
}

$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const code = $('access-code').value.trim();
  show('login-error', false); globalError('');
  if (!code) {
    $('login-error').textContent = 'Informe seu código de acesso.'; show('login-error', true);
    $('access-code').setAttribute('aria-invalid', 'true'); $('access-code').focus(); return;
  }
  $('access-code').removeAttribute('aria-invalid');
  $('login-button').disabled = true; $('login-button').textContent = 'Entrando…';
  try { await acceptState(await post('session', { code })); $('access-code').value = ''; $('begin-button').focus(); }
  catch (failure) { $('login-error').textContent = failure.message; show('login-error', true); $('access-code').setAttribute('aria-invalid', 'true'); }
  finally { $('login-button').disabled = false; $('login-button').textContent = 'Entrar'; }
});
$('begin-button').addEventListener('click', begin);
$('continue-button').addEventListener('click', begin);
$('mission-start-button').addEventListener('click', () => void begin({ skipIntro: true }));
$('record-button').addEventListener('click', () => { if (mode === 'recording') void stopRecording(); else void startRecording(); });
$('rerecord-button').addEventListener('click', () => void startRecording());
$('send-button').addEventListener('click', upload);
$('pause-button').addEventListener('click', () => void finish());
$('confirmed-pause-button').addEventListener('click', () => void finish());
$('evaluation-form').addEventListener('submit', saveEvaluation);
$('next-button').addEventListener('click', () => { if (task?.phase === 'collection' && !state.nextPhrase) void finish('completed'); else void begin(); });
$('switch-button').addEventListener('click', logout);
$('exit-button').addEventListener('click', logout);
$('sync-button').addEventListener('click', async () => { $('sync-button').disabled = true; await flushEvents(); $('sync-button').disabled = false; });
$('audio-preview').addEventListener('play', () => track('playback_started'));
$('phrase-image').addEventListener('error', () => {
  show('phrase-image', false);
  $('phrase-prompt').classList.remove('has-illustration');
});
window.addEventListener('online', () => void flushEvents());
window.addEventListener('beforeunload', event => {
  if (mode === 'recording' || mode === 'uploading' || savingDraft || submittingEvaluation || (draft && !draft.persisted)) { event.preventDefault(); event.returnValue = ''; }
});
window.addEventListener('pagehide', () => {
  if (state && eventQueue.length && navigator.sendBeacon) navigator.sendBeacon('/api/events', new Blob([JSON.stringify({ events: eventQueue.slice(0, 10) })], { type: 'application/json' }));
});
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'recording') void stopRecording(); });

try { await acceptState(await api('state')); }
catch (failure) { if (failure.status !== 401) globalError(`${failure.message} Você pode tentar entrar com seu código.`); }
