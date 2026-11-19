import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApplication } from '../server.mjs';

const dataDir = mkdtempSync(path.join(tmpdir(), 'ic-voice-browser-'));
const root = path.resolve(import.meta.dirname, '..', '..');
const captures = path.join(root, '.impeccable', 'review');
const config = JSON.parse(readFileSync(path.join(root, 'prototipo', 'config.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(path.join(root, 'prototipo', 'phrase-images.json'), 'utf8'));
config.participants.push({ id: 'browser-storage-test', code: 'TESTE-B01', condition: 'neutral' });
const app = createApplication({ dataDir, config });
const browserPath = process.env.BROWSER_PATH ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(existsSync);
let browser;
let url;
const errors = [];
const checks = [];
const check = name => { checks.push(name); console.log('OK:', name); };

async function visible(locator) { await locator.waitFor({ state: 'visible', timeout: 10000 }); }
async function phraseImage(page) {
  await visible(page.getByRole('button', { name: 'Começar gravação', exact: true }));
  const text = await page.locator('#phrase-text').textContent();
  const expected = manifest.images.find(image => image.text === text);
  assert.ok(expected, `Imagem não mapeada para ${text}`);
  await page.waitForFunction(() => {
    const image = document.getElementById('phrase-image'); return !image.hidden && image.complete && image.naturalWidth > 0;
  });
  assert.equal(await page.locator('#phrase-image').getAttribute('src'), `/assets/phrases/${expected.file}`);
  assert.equal(await page.locator('#phrase-image').getAttribute('alt'), expected.redundantWithPhrase ? '' : expected.alt);
}
async function startMission(page) {
  await visible(page.locator('#mission-intro'));
  assert.equal(await page.locator('#goal-panel').isVisible(), false);
  assert.equal(await page.locator('#recording-surface').isVisible(), false);
  await page.locator('#mission-start-button').click();
  await visible(page.locator('#record-button'));
  assert.equal(await page.locator('#mission-intro').isVisible(), false);
}
async function record(page, { expectImage = true } = {}) {
  if (expectImage) await phraseImage(page);
  await page.getByRole('button', { name: 'Começar gravação', exact: true }).click();
  await visible(page.getByRole('button', { name: 'Parar gravação', exact: true }));
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Parar gravação', exact: true }).click();
  await visible(page.getByRole('button', { name: 'Enviar gravação', exact: true }));
  await page.waitForFunction(() => !document.getElementById('send-button').disabled);
}
async function send(page) {
  await page.locator('#send-button').click();
  await visible(page.locator('#confirmed-panel'));
}
async function login(page, code) {
  await page.goto(url);
  await page.getByLabel('Código de acesso').fill(code);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await visible(page.locator('#begin-button'));
  await page.locator('#begin-button').click();
  await visible(page.locator('#record-button'));
}
async function noOverflow(page, width) {
  await page.setViewportSize({ width, height: 900 });
  const sizes = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
  assert.ok(sizes.document <= sizes.viewport + 1, `Overflow em ${width}: ${JSON.stringify(sizes)}`);
}

try {
  url = await app.listen(0);
  browser = await chromium.launch({
    ...(browserPath ? { executablePath: browserPath } : {}), headless: true,
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
  });
  const context = await browser.newContext({ permissions: ['microphone'], viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async options => {
      const result = await original(options);
      window.__recordingTracks = result.getTracks();
      return result;
    };
  });
  const page = await context.newPage();
  page.on('pageerror', failure => errors.push(failure.message));
  await page.goto(url);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Ir para o conteúdo');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
  await page.getByLabel('Código de acesso').fill('INVALIDO');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await visible(page.locator('#login-error'));
  await page.getByLabel('Código de acesso').fill('TESTE-G01');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('button', { name: 'Testar o gravador', exact: true }).click();
  assert.equal(await page.locator('#goal-panel').isVisible(), false);
  await record(page);
  assert.equal(await page.evaluate(() => window.__recordingTracks.every(track => track.readyState === 'ended')), true);
  await page.locator('#audio-preview').evaluate(audio => audio.play());
  assert.equal(await page.locator('#audio-preview').evaluate(audio => !audio.error), true);
  await page.getByRole('button', { name: 'Gravar novamente', exact: true }).click();
  await visible(page.getByRole('button', { name: 'Parar gravação', exact: true }));
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Parar gravação', exact: true }).click();
  await page.waitForFunction(() => !document.getElementById('send-button').disabled);
  check('entrada por código, teclado, microfone simulado, reprodução e regravação');

  await page.route('**/api/recordings', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Falha de conexão simulada.' }) }));
  await page.locator('#send-button').click();
  await visible(page.locator('#recording-error'));
  assert.equal((await page.evaluate(() => fetch('/api/state').then(r => r.json()))).confirmedCount, 0);
  await page.reload();
  await page.getByRole('button', { name: 'Retomar gravação', exact: true }).click();
  await visible(page.locator('#audio-preview'));
  await page.unroute('**/api/recordings');
  await send(page);
  assert.equal((await page.evaluate(() => fetch('/api/state').then(r => r.json()))).confirmedCount, 0);
  await page.getByRole('button', { name: 'Começar coleta', exact: true }).click();
  await visible(page.locator('#mission-intro'));
  assert.equal(await page.locator('#mission-path .mission-step').count(), 2);
  assert.match(await page.locator('#intro-objective').textContent(), /5 frases/);
  assert.match(await page.locator('.mission-purpose').textContent(), /pesquisa/);
  mkdirSync(captures, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(captures, 'mission-intro-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(captures, 'mission-intro-mobile.png'), fullPage: true });
  await startMission(page);
  await visible(page.locator('#goal-panel'));
  await page.evaluate(() => scrollTo(0, 0));
  assert.equal(await page.locator('#record-button').evaluate(element => element.getBoundingClientRect().bottom <= innerHeight), true);
  assert.match(await page.locator('#goal-count').textContent(), /0 de 5/);
  assert.equal(await page.locator('#phrase-text').textContent(), 'A janela está aberta.');
  check('falha mantém áudio após recarregar; treino não aumenta contribuições');

  await record(page);
  await page.route('**/api/recordings', async route => {
    const response = await route.fetch(); assert.equal(response.status(), 201);
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Resposta perdida após salvar.' }) });
  });
  await page.locator('#send-button').click();
  await visible(page.locator('#recording-error'));
  assert.equal((await page.evaluate(() => fetch('/api/state').then(r => r.json()))).confirmedCount, 1);
  await page.unroute('**/api/recordings');
  await send(page);
  assert.match(await page.locator('#goal-count').textContent(), /1 de 5/);
  assert.equal((await page.evaluate(() => fetch('/api/state').then(r => r.json()))).confirmedCount, 1);
  check('resposta perdida e reenvio não duplicam contribuição');

  await page.getByRole('button', { name: 'Pausar por agora', exact: true }).click();
  await visible(page.locator('#summary-screen'));
  assert.equal(await page.locator('#summary-count').textContent(), '1');
  await page.getByRole('button', { name: 'Retomar', exact: true }).click();
  await startMission(page);
  await visible(page.getByRole('button', { name: 'Começar gravação', exact: true }));
  await page.getByRole('button', { name: 'Começar gravação', exact: true }).click();
  await visible(page.getByRole('button', { name: 'Parar gravação', exact: true }));
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await visible(page.locator('#summary-draft'));
  assert.equal(await page.evaluate(() => window.__recordingTracks.every(track => track.readyState === 'ended')), true);
  await page.reload();
  await page.getByRole('button', { name: 'Retomar gravação', exact: true }).click();
  await send(page);
  assert.match(await page.locator('#goal-count').textContent(), /2 de 5/);
  await page.getByRole('button', { name: 'Próxima frase', exact: true }).click();
  await visible(page.getByRole('button', { name: 'Começar gravação', exact: true }));
  assert.equal(await page.locator('#phrase-text').textContent(), 'O livro está sobre a mesa.');
  check('pausar durante gravação libera microfone e preserva rascunho e sequência');

  // Completar a primeira missão e confirmar que a seguinte começa em zero.
  mkdirSync(captures, { recursive: true });
  for (let count = 3; count <= 5; count++) {
    await record(page); await send(page);
    assert.match(await page.locator('#goal-count').textContent(), new RegExp(`${count} de 5`));
    assert.equal(await page.locator('#mission-celebration').isVisible(), count === 5);
    if (count < 5) await page.locator('#next-button').click();
  }
  assert.match(await page.locator('#celebration-title').textContent(), /Missão 1 concluída/);
  assert.equal(await page.locator('.mission-step.is-complete').count(), 1);
  assert.equal(await page.locator('#mission-celebration').evaluate(element => {
    const rect = element.getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= innerHeight;
  }), true, 'A conclusão da missão deve ficar visível após o envio');
  for (const width of [320, 390, 768, 1440]) await noOverflow(page, width);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(captures, 'mission-complete-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(captures, 'mission-complete-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Próxima missão', exact: true }).click();
  await startMission(page);
  await visible(page.getByRole('button', { name: 'Começar gravação', exact: true }));
  assert.equal(await page.locator('#goal-title').textContent(), 'Missão 2');
  assert.match(await page.locator('#goal-count').textContent(), /0 de 5/);
  assert.equal(await page.locator('#mission-celebration').isVisible(), false);
  assert.equal(await page.locator('#phrase-text').textContent(), 'O caderno está na mochila.');
  check('missão concluída com cinco envios; próxima missão inicia em zero e mantém sequência');

  const neutralContext = await browser.newContext({ permissions: ['microphone'] });
  const neutral = await neutralContext.newPage();
  neutral.on('pageerror', failure => errors.push(failure.message));
  await login(neutral, 'TESTE-N01'); await record(neutral); await send(neutral);
  await neutral.getByRole('button', { name: 'Começar coleta', exact: true }).click();
  await visible(neutral.getByRole('button', { name: 'Começar gravação', exact: true }));
  assert.equal(await neutral.locator('#goal-panel').isVisible(), false);
  assert.equal(await neutral.locator('#phrase-text').textContent(), 'A janela está aberta.');
  await phraseImage(neutral);
  check('condição neutra mantém fluxo e frases, sem meta/progresso motivacional');

  await neutral.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Teste de acesso negado', 'NotAllowedError'); };
  });
  await neutral.getByRole('button', { name: 'Começar gravação', exact: true }).click();
  await visible(neutral.locator('#recording-error'));
  assert.match(await neutral.locator('#recording-error').textContent(), /bloqueado/);
  assert.equal((await neutral.evaluate(() => fetch('/api/state').then(r => r.json()))).confirmedCount, 0);
  check('erro de permissão apresenta recuperação e não conta envio');

  const blockedContext = await browser.newContext({ permissions: ['microphone'] });
  await blockedContext.addInitScript(() => {
    indexedDB.open = () => { throw new DOMException('Armazenamento bloqueado no teste', 'SecurityError'); };
  });
  const blocked = await blockedContext.newPage();
  blocked.on('pageerror', failure => errors.push(failure.message));
  await login(blocked, 'TESTE-B01'); await record(blocked);
  assert.match(await blocked.locator('#recording-error').textContent(), /nesta aba/);
  await blocked.getByRole('button', { name: 'Pausar', exact: true }).click();
  await visible(blocked.locator('#summary-screen'));
  assert.match(await blocked.locator('#summary-description').textContent(), /Mantenha esta aba aberta/);
  await blocked.getByRole('button', { name: 'Retomar', exact: true }).click();
  await send(blocked);
  check('armazenamento local bloqueado não promete persistência; rascunho em memória pode ser enviado');

  // Capturas em um único lote, após a verificação funcional.
  mkdirSync(captures, { recursive: true });
  const welcomeContext = await browser.newContext();
  const welcome = await welcomeContext.newPage();
  await welcome.goto(url);
  for (const width of [320, 390, 768, 1440]) await noOverflow(welcome, width);
  await welcome.setViewportSize({ width: 1440, height: 1000 });
  await welcome.screenshot({ path: path.join(captures, 'desktop-welcome.png'), fullPage: true });
  await welcome.setViewportSize({ width: 390, height: 844 });
  await welcome.screenshot({ path: path.join(captures, 'mobile-welcome.png'), fullPage: true });
  for (const width of [320, 390, 768, 1440]) await noOverflow(page, width);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(captures, 'desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(captures, 'mobile.png'), fullPage: true });
  await neutral.setViewportSize({ width: 390, height: 844 });
  await neutral.screenshot({ path: path.join(captures, 'mobile-neutral.png'), fullPage: true });
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await visible(page.locator('#summary-screen'));
  await page.screenshot({ path: path.join(captures, 'mobile-summary.png'), fullPage: true });
  check('sem rolagem horizontal em 320, 390, 768 e 1440 px; capturas de entrada/coleta/resumo');

  await page.locator('#evaluation-panel summary').click();
  await page.locator('#evaluation-ease').selectOption('4');
  await page.locator('#evaluation-gamefulness').selectOption('5');
  await page.locator('#evaluation-fatigue').selectOption('2');
  await page.locator('#evaluation-images').selectOption('helped');
  await page.locator('#evaluation-comment').fill('As imagens ajudaram; consegui pausar.');
  await page.route('**/api/evaluation', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Falha simulada nas respostas.' }) }));
  await page.locator('#evaluation-submit').click();
  await visible(page.locator('#evaluation-error'));
  assert.equal(await page.locator('#evaluation-ease').inputValue(), '4');
  await page.unroute('**/api/evaluation');
  await page.locator('#evaluation-submit').click();
  await visible(page.locator('#evaluation-status'));
  const evaluated = await page.evaluate(() => fetch('/api/state').then(r => r.json()));
  assert.equal(evaluated.evaluation.ease, 4);
  assert.equal(evaluated.evaluation.gamefulness, 5);
  assert.equal(evaluated.evaluation.fatigue, 2);
  assert.equal(evaluated.confirmedCount, 5);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(captures, 'evaluation-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(captures, 'evaluation-mobile.png'), fullPage: true });
  check('avaliação opcional salva facilidade, percepção de jogo, cansaço e imagens separadamente; falha preserva respostas');

  await page.getByRole('button', { name: 'Retomar', exact: true }).click();
  await startMission(page);
  await visible(page.getByRole('button', { name: 'Começar gravação', exact: true }));
  for (let count = 6; count <= 10; count++) {
    await record(page); await send(page);
    if (count < 10) await page.locator('#next-button').click();
  }
  assert.match(await page.locator('#goal-count').textContent(), /5 de 5/);
  assert.equal(await page.locator('.mission-step.is-complete').count(), 2);
  await page.getByRole('button', { name: 'Ver resumo', exact: true }).click();
  await visible(page.locator('#summary-screen'));
  assert.equal(await page.locator('#summary-count').textContent(), '10');
  assert.match(await page.locator('#summary-missions-text').textContent(), /2 de 2 missões concluídas/);
  assert.equal(await page.locator('#continue-button').isVisible(), false);
  await page.locator('#evaluation-panel summary').click();
  assert.equal(await page.locator('#evaluation-ease').inputValue(), '');
  await page.locator('#evaluation-submit').click();
  await visible(page.locator('#evaluation-error'));
  await page.locator('#evaluation-fatigue').selectOption('3');
  await page.locator('#evaluation-submit').click();
  await visible(page.locator('#evaluation-status'));
  const finalEvaluation = await page.evaluate(() => fetch('/api/state').then(r => r.json()));
  assert.equal(finalEvaluation.evaluation.ease, null);
  assert.equal(finalEvaluation.evaluation.fatigue, 3);
  check('última missão encerra o material sem criar missão extra; resumo confere os dez envios');

  const missingImageContext = await browser.newContext({ permissions: ['microphone'] });
  const missingImage = await missingImageContext.newPage();
  missingImage.on('pageerror', failure => errors.push(failure.message));
  await missingImage.route('**/assets/phrases/treino-01.webp', route => route.fulfill({ status: 404, body: '' }));
  await login(missingImage, 'TESTE-G02');
  await missingImage.waitForFunction(() => document.getElementById('phrase-image').hidden);
  assert.equal(await missingImage.locator('#phrase-text').textContent(), config.practicePhrase.text);
  await record(missingImage, { expectImage: false }); await send(missingImage);
  await missingImage.getByRole('button', { name: 'Começar coleta', exact: true }).click();
  await startMission(missingImage);
  await phraseImage(missingImage);
  check('imagens correspondem às onze frases; imagem indisponível preserva texto, gravação e avanço');

  assert.deepEqual(errors, [], 'Erros de JavaScript no navegador');
  console.log(`\n${checks.length} grupos de verificações concluídos com áudio sintético, sem participantes.\nCapturas: ${captures}`);
} finally {
  await browser?.close(); await app.close();
  const target = path.resolve(dataDir);
  assert.equal(path.dirname(target), path.resolve(tmpdir()));
  assert.ok(path.basename(target).startsWith('ic-voice-browser-'));
  rmSync(target, { recursive: true, force: true });
}
