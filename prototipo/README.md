# Protótipo de coleta de voz

Versão local 0.4 da IC, com apresentação das missões, progresso compacto, ilustrações e avaliação exploratória opcional. Usa frases e códigos de teste; os dados são identificados como `technical`. Ainda não é uma implantação para coleta com participantes.

## Abrir no computador

Requisito: Node.js 22.15 ou superior. No PowerShell, a partir da pasta IC:

```powershell
cd prototipo
npm start
```

Abra [http://localhost:3000](http://localhost:3000) e use um dos códigos:

| Código de teste | Versão |
| --- | --- |
| `TESTE-G01` | Metas, progresso e feedback motivacional. |
| `TESTE-G02` | Novo teste gamificado, com progresso independente do G01. |
| `TESTE-G03` | Novo teste gamificado para experimentar as ilustrações desde a familiarização. |
| `TESTE-G04` | Novo teste gamificado para experimentar os refinamentos de UX desde o início. |
| `TESTE-N01` | Fluxo neutro, com as mesmas instruções e confirmações funcionais. |
| `TESTE-N02` | Novo teste neutro, com avaliação opcional e progresso independente do N01. |

Esses códigos são públicos para testes locais. Não serão credenciais de uma coleta real. Cada código retoma seus próprios envios. Para iniciar um teste independente, adicione outro identificador/código em `config.json` e reinicie o servidor.

Primeiro, grave e envie a frase de familiarização. Depois, grave, ouça, regrave se quiser e envie as frases de coleta. Na condição gamificada, as dez frases formam duas missões de cinco envios. A apresentação mostra a trilha completa, objetivo, quantidade e propósito; a gravação mostra somente a missão atual e o progresso compacto. A familiarização fica fora das missões. O contador muda após confirmação do servidor. Após o envio, continuar e pausar ficam próximos. Pausar encerra a sessão; Retomar abre outra. Fechar a aba preserva envios confirmados e um rascunho quando o navegador permite armazenamento local.

Para conferir a atualização, pare seu servidor com `Ctrl+C`, execute novamente `node server.mjs` e recarregue com `Ctrl+F5`; use `TESTE-G04` para começar do início. Todos os códigos anteriores preservam seus envios. Sessões guardam `interface_version`; a migração dos bancos mais antigos acrescenta essa coluna com valor `0.1.0`, preserva as versões já registradas e abre uma nova sessão ao retomar na interface `0.4.0-ux`. Os arquivos de áudio e as contagens anteriores são preservados; versões diferentes ficam identificáveis na exportação.

O servidor fica vinculado a `127.0.0.1`; não abre acesso pela rede. Para parar, pressione `Ctrl+C` no terminal. Se a porta estiver ocupada:

```powershell
$env:PORT = '3001'
npm start
```

## O que foi implementado

- Entrada por código, com condição definida na configuração.
- Três telas: entrada/instruções, gravação e resumo.
- Familiarização separada (`practice`) e coleta (`collection`).
- Gravar, parar, ouvir, regravar, enviar e tratar erros do microfone.
- Áudio e metadados persistidos; reenvios da mesma tentativa são idempotentes.
- Rascunho local para recuperar falhas de envio ou recarregamento da página no mesmo navegador/código.
- Pausa, retomada, sequência fixa e registros de ações com identificação de tarefa e sessão.
- Missões com meta configurável (cinco envios por padrão), trilha na apresentação e progresso compacto na gravação, feedback a cada envio, celebração estática e resumo. Ao iniciar a próxima missão, a barra começa em zero. Nenhum bloqueio ao continuar ou encerrar antes da meta.
- Exportação de gravações, tarefas iniciadas, eventos, sessões e avaliações opcionais.
- Ilustrações locais para as dez frases de coleta e para a familiarização, compartilhadas pelas condições neutra e gamificada. Texto e gravação continuam disponíveis caso uma imagem não carregue.
- Avaliação opcional no resumo, igual nas duas condições, com facilidade, percepção de jogo e cansaço em campos independentes, além de imagens e comentário.

## Ilustrações das frases

Os onze arquivos ficam em `public/assets/phrases/`, em WebP de 640 × 640 pixels. Foram gerados com a ferramenta integrada `image_gen` e convertidos para WebP para reduzir o tamanho, preservando o conteúdo. O [manifesto consolidado](phrase-images.json) reúne o prompt comum, a cena de cada frase, descrição alternativa, origem, tamanho e SHA-256; não é servido publicamente.

O prompt comum pede uma ilustração editorial acolhedora para adultos, cena única e clara, cores naturais, fundo claro e ausência de texto, logotipo ou marca d'água. Cada prompt específico representa a situação da frase: janela aberta, céu azul, livro sobre mesa, água no copo, porta fechada, caderno na mochila, jardim florido, cadeira próxima à mesa, cozinha iluminada e amanhecer. O microfone representa a familiarização. O prompt completo de cada imagem é a combinação de `sharedPrompt`, a frase em `text` e `scenePrompt`, seguindo o formato registrado no manifesto.

O servidor associa imagens pelo identificador **e pelo texto exato** da frase, evitando reaproveitar uma cena incorreta quando o banco mudar. As imagens são iguais nas duas condições para manter o contraste experimental em metas, progresso e feedback. Não alteram frases, ordem ou a unidade de tarefa concluída. O vínculo visual é versionado pela interface; o conteúdo do banco permanece intacto. Antes do piloto, conferir clareza, pertinência cultural e se a pessoa entende que deve ler a frase apresentada.

As onze cenas foram marcadas como redundantes com o texto adjacente (`redundantWithPhrase`): o HTML usa `alt=""` para não repetir a leitura da frase. As descrições originais permanecem no manifesto; uma futura imagem que acrescente informação precisa de alternativa própria. Essa revisão técnica não confirma compreensão ou ausência de distração com o público.

## Avaliação exploratória

No resumo, abrir **Como foi usar a plataforma?**. Todas as perguntas são opcionais; basta uma resposta ou comentário para enviar. O formulário não bloqueia a retomada. Se o envio falhar, as respostas ficam no formulário enquanto a pessoa permanecer nele; respostas ainda não enviadas não têm recuperação após recarga ou saída.

| Campo exportado | Interpretação |
| --- | --- |
| `ease` | 1 = muito difícil; 5 = muito fácil usar os controles. |
| `gamefulness` | 1 = nada; 5 = a atividade pareceu muito um jogo. |
| `fatigue` | 1 = nenhum; 5 = muito cansaço na sessão. |
| `images` | `helped`, `neutral`, `distracting`, `unclear` ou `not_seen`. |
| `comment` | Comentário opcional de até 1.000 caracteres. |

Campos omitidos ficam nulos no banco e vazios no CSV. Não há escore combinado. As perguntas são autorais (`ux-exploratorio-v1`), não constituem UEQ-S, GAMEFULQUEST ou escala validada de motivação. Cansaço da sessão não permite atribuir a causa à fala, à interface ou à gamificação; comentários e observação devem ajudar nessa interpretação. Escolha final do instrumento e compreensão das perguntas seguem pendentes no protocolo e no piloto.

`POST /api/evaluation` associa a resposta ao `sessionId` informado e confere a autoria. Há uma linha por sessão; reenviar atualiza os valores, preserva `responded_at` e altera `updated_at`. Uma nova sessão começa sem respostas. O questionário registra também versão, condição e participante na exportação; não altera contribuições nem pontua a fala.

## Onde ficam os dados

- `data/coleta.sqlite`: participantes de teste, sessões, tarefas, gravações, eventos e avaliações.
- `data/audio/`: arquivos de áudio com nomes aleatórios. Nenhum arquivo é servido publicamente pelo servidor.
- IndexedDB do navegador: rascunho ainda não enviado, separado por código/identificador. Ele é removido após confirmação ou substituído ao regravar. Limpar os dados do site remove esse rascunho.
- Armazenamento local do navegador: fila de eventos pendentes, sincronizada quando a conexão volta. A exportação contém os eventos efetivamente recebidos.

Esta pasta está dentro do OneDrive; os arquivos locais podem ser sincronizados pelo serviço. Definir armazenamento, acesso e procedimentos institucionais antes de usar dados de participantes. Um código de pesquisa não torna a voz anônima.

## Exportar

Com ou sem o servidor em execução, na pasta `prototipo`:

```powershell
npm run export
```

Cria uma pasta datada em `exportacoes/` com `gravacoes.csv`, `tarefas.csv`, `eventos.csv`, `sessoes.csv`, `avaliacoes.csv` e `resumo.json`. Para incluir uma cópia dos áudios:

```powershell
npm run export -- --include-audio
```

Tokens de sessão e códigos de acesso não fazem parte dos CSVs. Tarefas sem envio também são exportadas, permitindo calcular conclusão sem contar somente os sucessos. Gravações, eventos e sessões incluem `interface_version`, permitindo distinguir os testes anteriores desta apresentação de missões.

## Configuração e limites de interpretação

`config.json` reúne códigos, condições, meta e frases provisórias. As categorias continuam em aberto (`domain: null`). Ao alterar textos ou ordem de frases, altere também `bankVersion`; o servidor rejeita uma mudança silenciosa de conteúdo. Cada sessão registra o tamanho configurado da meta. A condição de um identificador já utilizado não pode ser trocada silenciosamente.

Os áudios mantêm o formato produzido pelo navegador, como WebM/Opus ou MP4. Não há conversão para WAV, transcrição ou avaliação de pronúncia. A verificação do servidor confere tamanho e assinatura do contêiner; não certifica que o conteúdo seja audível ou utilizável. `reported_duration_ms` corresponde ao tempo medido no navegador, sem decodificação independente. O limite de envio é 25 MB.

A definição analítica de sessão e os sete dias de acompanhamento continuam pendentes. Os registros atuais mostram início, pausa, retomada e envio; fechar a aba não garante um horário de encerramento. A meta de cinco é configuração técnica, não uma quota validada.

Duolingo foi solicitado como referência de interação: missões curtas, caminho visível e conclusão celebrada. Isso apresenta o conjunto já previsto de metas, progresso e feedback. Não acrescenta XP, ranking, sequências diárias, perdas, sons ou nota de pronúncia. A [apresentação oficial do caminho do Duolingo](https://blog.duolingo.com/new-duolingo-home-screen-design/?version=published) é referência de design, não evidência de eficácia na população desta IC. Antes do piloto, conferir compreensão das missões e adequação das mensagens ao público.

A gravação usa `MediaRecorder` e `getUserMedia`. O microfone requer um contexto seguro, como `localhost` no computador ou HTTPS; abrir um endereço HTTP da rede pelo celular não equivale a localhost. [Documentação de gravação](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), [acesso ao microfone](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). A interface foi verificada em larguras de celular; microfones físicos de celulares e Safari ainda precisam ser testados.

## Verificações técnicas

O aplicativo não exige instalar pacotes para executar. A única dependência de desenvolvimento é Playwright. Para reproduzir os testes:

```powershell
npm install
npm test
npm run test:browser
```

Os testes do servidor cobrem autorização, armazenamento, falhas, idempotência, retomada, integridade de configuração e exportação. Os testes no navegador usam Chrome/Edge instalado e microfone sintético: exercitam o fluxo real de gravação, erros, rascunho após recarga, resposta perdida, pausa e as duas condições. Se necessário, informe o executável em `BROWSER_PATH`. Dados sintéticos ficam em diretórios temporários próprios, separados de `data/`.

As capturas ficam em `../.impeccable/review/`. Sem ensaio com participantes, auditoria completa de acessibilidade ou publicação. O módulo SQLite integrado é experimental no Node.js 22.15 e pode emitir aviso ao iniciar. [Documentação da versão](https://nodejs.org/download/release/v22.15.0/docs/api/sqlite.html).

**Resultado da versão 0.4 em 18/11/2026:** doze testes de servidor e doze grupos no navegador passaram. Cobrem migração, gravação, rascunhos, missões, imagens, respostas independentes, falha no envio da avaliação, autoria, atualização sem duplicar e exportação. As capturas mostram apresentação de missão, gravação compacta, confirmação, resumo e formulário em computador/celular. O processo auxiliar de conceitos da versão 0.1 ficou degradado, sem comp ou referência externa de qualidade; a revisão usa o escopo e o contrato abaixo. Esses resultados não substituem testes com dispositivos físicos ou com o público.

A revisão independente das treze capturas e dos arquivos atuais retornou `ship`, sem correções materiais. Os três avisos do detector foram conferidos: imagem inicialmente oculta recebe `src` pela API, a borda inferior pertence ao botão tátil e os travessões separam valores/rótulos das respostas. DESIGN.md e seu sidecar foram reconciliados com a implementação. A revisão é técnica e visual, não uma validação empírica da experiência.

## Decisões de interface

Modo Operate: a tarefa de gravar com controle do próprio ritmo orienta a interface. A implementação segue a estrutura de três telas do [escopo](../escopo/escopo-estudo.md#decisões-provisórias-para-a-primeira-versão); o processo auxiliar de conceitos retornou degradado, sem referências visuais externas.

Contrato de desenvolvimento, mantido fora dos arquivos públicos:

- **THESIS:** uma tarefa por vez, com frase legível, ilustração contextual e confirmação inequívoca de recebimento; na condição gamificada, cada contribuição avança uma missão curta.
- **OWN-WORLD:** fundo claro, texto escuro e uma família tipográfica de sistema. Na condição gamificada, verde mais vivo, trilha de missões e estrela dourada de conclusão, conforme a referência Duolingo solicitada. Superfícies sem sombras. Cores de erro acompanham texto explicativo.
- **STORY:** entrar com código, familiarizar-se, gravar e revisar, confirmar envio e continuar ou pausar.
- **FIRST VIEWPORT:** entrada e instruções lado a lado no computador e empilhadas no celular; apresentação gamificada com trilha completa e propósito; gravação com progresso compacto, ilustração ao lado da frase e ação principal. Após confirmar, continuar e pausar ficam juntos. A celebração de missão entra na área visível. No resumo, avaliação opcional recolhida sob um controle expansível. Progresso adicional somente na condição gamificada.
- **FORM:** fluxo guiado conforme o escopo autorizado; referência auxiliar de conceito `1930e24d`, degradada. A versão 0.3 acrescentou ilustrações geradas; prompts e proveniência estão em `phrase-images.json`. A versão 0.4 aplica os seis refinamentos de UX solicitados sem acrescentar mecânicas ao tratamento.
- **FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

[Escopo e pendências da pesquisa](../escopo/escopo-estudo.md) · [Checklist](../escopo/tarefas.md).
