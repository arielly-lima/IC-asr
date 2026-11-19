---
name: "Coleta de voz"
description: "Interface local para gravar, revisar e enviar frases no próprio ritmo."
colors:
  canvas: "#f4f6f2"
  paper: "#ffffff"
  ink: "#1d302b"
  muted: "#50625b"
  line: "#ccd6cf"
  accent: "#1e6254"
  accent-hover: "#164c41"
  sage: "#e7eee5"
  focus: "#145cbd"
  error: "#992e29"
  error-bg: "#fff0ee"
  warning: "#704715"
  warning-bg: "#fff5e4"
  game-accent: "#267318"
  game-accent-hover: "#1b5811"
  mission-soft: "#edf8df"
  mission-edge: "#a4ca84"
  mission-track: "#d9e7cc"
  reward-ink: "#765014"
  reward-bg: "#fff4cf"
  reward-edge: "#e7c45e"
  reward-star: "#f3c545"
typography:
  welcome:
    fontSize: "2.75rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  headline:
    fontSize: "2rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontSize: "1.2rem"
    fontWeight: 650
    lineHeight: 1.3
  phrase:
    fontSize: "1.8rem"
    fontWeight: 550
    lineHeight: 1.5
  body:
    fontFamily: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontWeight: 600
  mission:
    fontSize: "1.3rem"
    fontWeight: 750
    lineHeight: 1.3
  celebration:
    fontSize: "1.5rem"
    fontWeight: 750
    lineHeight: 1.3
rounded:
  surface: "14px"
  button: "9px"
  field: "8px"
  tag: "6px"
  mission: "14px"
  game-button: "12px"
  progress: "10px"
  illustration: "12px"
spacing:
  sm: ".5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: ".72rem 1.2rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: ".72rem 1.2rem"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    padding: ".4rem .2rem"
  input-code:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: ".6rem .8rem"
    height: "54px"
    width: "100%"
  instructions:
    backgroundColor: "{colors.sage}"
    rounded: "{rounded.surface}"
    padding: "2rem"
  recording-surface:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.surface}"
  goal-progress:
    backgroundColor: "{colors.mission-track}"
    rounded: "{rounded.progress}"
    height: "16px"
    width: "100%"
  test-label:
    textColor: "{colors.muted}"
    rounded: "{rounded.tag}"
    padding: ".2rem .65rem"
  button-gamified:
    backgroundColor: "{colors.game-accent}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.game-button}"
    padding: ".72rem 1.2rem"
  button-gamified-hover:
    backgroundColor: "{colors.game-accent-hover}"
  mission-panel:
    backgroundColor: "{colors.mission-soft}"
    rounded: "{rounded.mission}"
    padding: ".9rem 1.2rem"
  mission-intro:
    backgroundColor: "{colors.mission-soft}"
    rounded: "16px"
    padding: "1.8rem"
  mission-celebration:
    backgroundColor: "{colors.reward-bg}"
    textColor: "{colors.reward-ink}"
    rounded: "{rounded.surface}"
    padding: "1.2rem"
  mission-preview:
    backgroundColor: "{colors.mission-soft}"
    textColor: "{colors.game-accent}"
    rounded: "{rounded.surface}"
    padding: "1rem"
  phrase-illustration:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.illustration}"
    width: "100%"
    height: "auto"
  phrase-prompt-illustrated:
    padding: "1.3rem 2rem"
  evaluation-panel:
    textColor: "{colors.ink}"
    padding: "1rem 0 0"
  evaluation-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: ".6rem .7rem"
    width: "100%"
---

# Design System: Coleta de voz

## Overview

**Creative North Star: "Uma tarefa por vez"**

Uma tarefa por vez organiza uma interface clara e contida: fundo claro, texto escuro, instruções diretas e ações amplas. A tipografia de sistema foi autorizada para esta UI funcional.

Superfícies planas mantêm a frase e o estado do gravador como prioridades. A condição gamificada apresenta a trilha antes da missão, mantém progresso compacto durante a gravação e celebra a conclusão de forma estática; a referência Duolingo solicitada orienta a interação, sem constituir evidência de eficácia. Ilustrações figurativas acompanham as frases nas duas condições e na familiarização, mantendo o texto separado. Não há animação decorativa.

**Key Characteristics:**

- Frase legível e ação explícita.
- Estado comunicado por texto, ícone e cor.
- Ritmo controlado pela pessoa, com próximo passo e pausa juntos.
- Missões e conquista visual somente na condição gamificada.
- Apoio visual equivalente nas duas condições.

## Colors

### Primary

Verde contido: `accent` identifica ações e confirmações; `accent-hover` aprofunda ações ao passar o ponteiro. `sage` sustenta instruções e realces suaves. Na coleta com `is-gamified`, `game-accent` e `game-accent-hover` registram as substituições locais de `--accent` e `--accent-hover`; `mission-soft`, `mission-edge` e `mission-track` estruturam o painel e a trilha. Prévia e resumo usam o mesmo verde claro.

### Secondary

Dourado de conclusão: `reward-bg`, `reward-edge` e `reward-ink` formam o aviso estático; `reward-star` preenche a estrela. A conquista representa envios salvos.

### Neutral

`canvas` é o fundo; `paper`, a superfície de gravação; `ink`, o texto principal; `muted`, orientações; `line`, divisórias. `focus` marca navegação por teclado. Pares `error/error-bg` e `warning/warning-bg` identificam erro e pendência com explicação.

**The Estado Explícito Rule.** A cor acompanha texto de estado; confirmação aparece somente após o servidor confirmar o recebimento.

## Typography

Uma única família, herdada de `body`, atende títulos e conteúdo. A entrada usa `welcome`, coleta/resumo usam `headline`, instruções usam `title`, a frase usa `phrase` e controles usam peso de `label`. Textos de apoio variam de (.78rem) a (.9rem). A introdução usa (1.1rem) e limite de (44ch). Contadores usam algarismos tabulares. Missões usam `mission`; celebrações usam `celebration`. No celular, esses títulos reduzem para (1.15rem) e (1.3rem), respectivamente. A apresentação da missão usa título de (1.6rem), reduzido para (1.4rem) no celular, com peso (650). Rótulos da avaliação usam (.95rem) e peso (600).

## Layout

Cabeçalho, conteúdo e rodapé compartilham largura máxima (1120px) e margem lateral total (80px). A entrada usa duas colunas (1.12fr/1fr), intervalo (5rem), formulário de até (360px). A coleta centraliza até (850px); o resumo, até (650px).

Até (850px), a entrada reduz o intervalo para (2rem), o título para (2.2rem) e o painel para padding (1.5rem). Até (650px), a base tipográfica vira (17px), as margens laterais viram (18px), a entrada empilha e seu título usa (2.25rem). Os demais títulos usam (1.65rem), a frase (1.5rem); revisão, ações após confirmação, ações do resumo e rodapé empilham. O cabeçalho da coleta e o rótulo da meta permitem quebra. O progresso compacto passa de padding (.9rem 1.2rem) para (1rem). A apresentação da missão passa de (1.8rem) para (1.3rem 1rem); seus nós passam de (60px) para (50px). O botão inicial tem largura mínima (260px) no computador e ocupa toda a largura no celular.

Com ilustração, a frase usa grade de (160px minmax(0, 1fr)), intervalo (1.5rem) e padding (1.3rem 2rem). Até (650px), a grade vira (100px minmax(0, 1fr)), intervalo (.9rem) e padding (1.1rem 1rem); o texto usa (1.25rem), alinhado à esquerda e sem padding próprio.

## Elevation & Depth

Não há sombras. Fundo sálvia, superfície branca e bordas de (1px) fornecem separação. Botões primários gamificados acrescentam borda inferior de (4px), sem elevação por sombra.

**The Superfície Plana Rule.** Separar áreas por fundo, borda e espaço, sem sombras.

## Shapes

Superfícies e painéis usam `surface`; botões base, `button`; campos e avisos, `field`; selo de teste, `tag`. O progresso compacto usa `mission`; a apresentação da missão tem raio de (16px). Primários gamificados usam `game-button` e a barra usa `progress`. Nós da trilha, marcadores e números das instruções são circulares. Ícones são SVG de traço (1.8), geralmente (24px); estrelas são preenchidas. Ilustrações usam `illustration`, proporção quadrada e `object-fit: contain`, sobre `canvas`.

## Components

- **Botões:** altura mínima (52px), texto com peso (600). Primário escurece no hover e usa (#103d33) ao pressionar; secundário tem borda (#93a59a) e hover sálvia. Ação textual é sublinhada, com altura mínima (44px). Desabilitados usam opacidade (.65) e cursor de espera.
- **Botão gamificado:** fora da gravação, primários na coleta têm borda inferior (#194e10); ao pressionar, a borda reduz para (1px), o padding superior cresce (3px) e o fundo usa `game-accent-hover`. O estado de gravação mantém a identificação vermelha.
- **Campo de código:** borda (#84988c), entrada visualmente maiúscula; erro usa borda de `error`, texto associado e `aria-invalid`.
- **Foco:** controles, links, áudio, selects, área de comentário e abertura da avaliação usam contorno de (3px) em `focus`, afastado (4px). Mudanças de tela movem foco ao título; estados relevantes são anunciados em região viva.
- **Gravador:** frase com apoio visual; estado textual com marcador e cronômetro. O botão alterna entre começar e parar; ao gravar, usa (#9c3028), hover (#7e211c) e marcador (#b53229). Após parar, aparecem áudio nativo, regravação e envio. Durante envio, controles dependentes ficam indisponíveis. Falha preserva a gravação para nova tentativa; recebimento confirmado mostra orientação do próximo passo, ação principal e “Pausar por agora” juntas. No fim do material, fica “Ver resumo” e a pausa secundária é ocultada.
- **Ilustrações de frase:** (11) WebP locais de (640 × 640px), geradas com `image_gen`, cobrem familiarização e frases de teste. Objetos e cenas reconhecíveis, formas suaves e sombreado pintado usam fundo claro, madeira quente, verdes naturais, azul e terracota; essas cores pertencem aos assets, sem novos tokens da interface. O vínculo exige ID e texto exatos. As (11) cenas redundantes com a frase usam `alt=""` para evitar leitura duplicada; descrições originais permanecem no manifesto. Uma futura imagem que acrescente informação exige alternativa própria. A frase permanece em elemento próprio. Ausência ou erro oculta a imagem e retorna ao layout de texto, preservando a gravação. Assets ficam em `prototipo/public/assets/phrases/`; `prototipo/phrase-images.json` mantém prompts compartilhado/específico, original gerado, SHA256 e bytes.
- **Missões:** somente na coleta gamificada. A configuração atual divide (10) frases em (2) missões de (5) envios confirmados; o código deriva total e alvos da configuração, incluindo última missão parcial. A apresentação separa objetivo, quantidade, trilha, contribuição à pesquisa e regras de contagem. Durante a gravação, apenas título, contagem, barra de (16px) e mensagem curta mostram a missão atual. Ao avançar, a nova missão começa em zero; retomar um rascunho segue diretamente para a revisão.
- **Trilha:** visível na apresentação da missão, lista informativa sem botões nem bloqueio de navegação; rótulos “Concluída”, “Em andamento” e “A seguir” acompanham check, microfone e bandeira. A etapa atual usa `aria-current="step"` e contorno externo de (4px), afastado (3px).
- **Celebração:** após confirmação do último envio da missão, painel dourado com estrela de (48px), título e quantidade salva. A próxima ação vira “Próxima missão” ou “Ver resumo”; a pessoa pode pausar. É uma confirmação estática; a interface a traz ao centro da tela com rolagem instantânea após a confirmação.
- **Resumo:** quantidade e duração enviadas em duas colunas; aviso distingue rascunho guardado de gravação disponível somente na aba. Retomar aparece quando há tarefa ou gravação pendente. Na condição gamificada, após familiarização, a entrada antecipa missão e progresso; o resumo informa missões concluídas e conclusão da jornada.
- **Avaliação opcional:** no resumo, `details/summary` começa fechado e oferece os mesmos campos nas duas condições. Facilidade, percepção de jogo e cansaço usam selects independentes de (1–5), com “Prefiro não responder”; imagens usam categorias próprias e comentário aceita até (1000) caracteres. São perguntas autorais exploratórias, sem escore conjunto. Labels explícitos, campos de altura mínima (52px), borda (#84988c), raio `field`, padding (.6rem .7rem) e textarea redimensionável verticalmente. Ao enviar, formulário e navegação do resumo ficam temporariamente indisponíveis; sucesso é anunciado com foco na mensagem e respostas podem ser atualizadas. Falha mantém os valores para nova tentativa.
- **Movimento:** botões transitam cores em (150ms ease-out); `prefers-reduced-motion: reduce` desativa transições.

## Do's and Don'ts

### Do:

- Do preservar rótulos em português, foco visível e mensagens de erro acionáveis.
- Do manter a mesma frase, ilustração e controles nas condições neutra e gamificada.
- Do manter a frase em texto, `alt=""` nas cenas redundantes e retorno ao texto quando a imagem não carregar.
- Do manter avaliação opcional e respostas independentes, com alternativa de não responder.

### Don't:

- Don't acrescentar pressão de tempo ou animação decorativa.
- Don't substituir o texto pela ilustração nem condicionar a gravação ao carregamento da imagem.
- Don't mostrar missões, trilha ou celebração na condição neutra nem na familiarização.
- Don't acrescentar XP, ranking, streak, som ou avaliação de pronúncia.
- Don't somar facilidade, percepção de jogo e cansaço em um escore conjunto.

Fonte de verdade: `prototipo/public/styles.css`, `index.html`, `app.js` e `prototipo/phrase-images.json` (ilustrações de 18/11/2026; interface `0.4.0-ux`). Esta documentação descreve a implementação; não valida acessibilidade com participantes ou compatibilidade de microfones físicos.

