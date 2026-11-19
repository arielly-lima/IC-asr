# Síntese crítica da revisão sobre gamificação na coleta de voz

**Primeira versão em 06/11/2026; consolidada em 17/11 e ampliada com UX em 18/11/2026.** A [seção de diretrizes](#ux-diretrizes-para-refinar-a-interface) relaciona a literatura à inspeção da interface 0.3 e registra os seis refinamentos implementados na 0.4. A revisão da estudante, a compreensão com o público e o fechamento do protocolo seguem pendentes. O nome do arquivo foi preservado para manter os links.

## Relação com a hipótese original

A [hipótese da proposta original](../escopo/escopo-estudo.md#hipótese-de-pesquisa) relaciona gamificação fundamentada em motivação e interfaces acessíveis a maior engajamento e retenção e, potencialmente, a dados mais extensos, diversificados e com maior cobertura fonética. A revisão dá razões para investigar essa relação, sem tratá-la como resultado já estabelecido.

**Operacionalização proposta para o recorte escolhido:** investigar se acrescentar metas, progresso e feedback motivacional a um mesmo fluxo acessível favorece a participação e a continuidade da coleta, observadas por registros de uso e volume de áudio. Os sete dias previstos são uma janela curta a validar pela viabilidade, sem sustentar conclusões sobre retenção prolongada.

| Parte da hipótese original | Como será tratada no recorte atual |
| --- | --- |
| Maior engajamento | Observar contribuições, tarefas iniciadas/concluídas, sessões e experiência relatada. Não reduzir engajamento a uma única contagem. |
| Maior retenção | Observar dias ativos e retorno dentro da janela definida, com oportunidades de acompanhamento equivalentes. |
| Dados mais extensos | Comparar quantidade de envios e duração de áudio; informar separadamente o aproveitamento técnico. |
| Dados diversificados | Descrever quem participou e a distribuição por categorias, quando definidas. Mais gravações da mesma pessoa não demonstram maior diversidade de falantes ou de fonemas. |
| Maior cobertura fonética e melhor ASR | Não serão testados nesta IC; permanecem trabalhos futuros. O alinhamento desse recorte com a hipótese mais ampla depende da orientação. |

A proposta menciona SDT e Octalysis. Nesta revisão, a fundamentação motivacional efetivamente examinada é a SDT, acompanhada de estudos empíricos de gamificação. Octalysis não foi avaliado aqui como evidência experimental e sua menção não autoriza atribuir eficácia às mecânicas nem ampliar o escopo.

## O que a literatura sustenta e onde permanece a questão

Deterding e colaboradores oferecem a delimitação conceitual; Ryan e Deci permitem discutir a qualidade da motivação e as necessidades de autonomia, competência e pertencimento. Essa base justifica formular mecanismos plausíveis e avaliar sua experiência concreta. Não demonstra que qualquer barra de progresso ou mensagem satisfaça essas necessidades. [Deterding et al., seções 4–6](https://med.uniroma2.it/wp-content/uploads/2024/07/009-from-game-design-elements-to.pdf), [Ryan e Deci](https://www.selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf).

Os experimentos também impedem uma previsão simples de sucesso. Sailer et al. observaram efeitos distintos entre configurações em uma simulação; seu controle já incluía pontos. Mekler et al., em anotação de imagens, encontraram aumento de produção sem aumento correspondente de motivação intrínseca. São tarefas diferentes da coleta de voz, mas mostram por que o contraste e as medidas devem ser explícitos. [Sailer et al.](https://d-nb.info/1309619042/34), [Mekler et al.: fonte e leitura crítica](fichamentos/fichamento-mekler-2017.md).

Liu et al. constituem um antecedente diretamente relacionado: as crianças realizaram coleta convencional e gamificada, houve preferência pelo jogo, mas não diferença significativa na quantidade ou no escore de engajamento; a eficiência foi menor no jogo. A IC deve investigar também custos e resultados nulos, sem equiparar preferência a maior contribuição. O estudo não acompanha retorno por vários dias. [Liu et al., resultados e limites](https://pure.tue.nl/ws/portalfiles/portal/356551976/A_Novel_Gamified_Approach_for_Collecting_Speech_Data_from_Young_Children_with_Dysarthria_Feasibility_and_Positive_Engagement_Evaluation_1_.pdf).

Common Voice e Shor dão contexto à formação e ao uso de dados para ASR; MacDonald e Hasegawa-Johnson orientam o procedimento de coleta. Suas funções na argumentação são distintas das evidências sobre gamificação. As notas e limites estão no [roteiro](revisao-bibliografica.md#leituras-concluídas-em-1711-notas-condensadas), no [fichamento de MacDonald](fichamentos/fichamento-macdonald-2021.md) e no [fichamento completado de Hasegawa-Johnson](fichamentos/fichamento-hasegawa-johnson-2024.md). O aproveitamento futuro dos áudios exigiria avaliação própria; não será inferido dos registros de participação.

Howarth oferece relatos de barreiras, suporte e distração com recursos de jogo, com consulta restrita a trechos indexados. Vocalize e HeyJay! são apoios de contexto e procedimento. Nenhum desses usos substitui um teste do conjunto proposto na IC. A distinção entre leitura integral, seções e trechos está registrada na [conferência das consultas](revisao-bibliografica.md#alcance-das-consultas-parciais-e-selecionadas). [Howarth et al., resultados e limitações](https://www.tandfonline.com/doi/full/10.1080/10400435.2024.2328082).

A questão que permanece para este projeto é como um conjunto simples de mecânicas funciona no fluxo, nas condições de acesso e no público efetivamente recrutado, inclusive quando a participação não aumenta ou requer apoio. A revisão exploratória não demonstra ausência de trabalhos semelhantes nem sustenta alegação de pioneirismo.

## Justificativa das escolhas de gamificação

As regras abaixo são propostas da IC derivadas criticamente da revisão. Elas não foram testadas pelos artigos exatamente nessa combinação.

| Escolha | Por que foi escolhida | Regra proposta e o que observar |
| --- | --- | --- |
| **Metas delimitadas** | Tornar a tarefa compreensível e oferecer um marco alcançável. A SDT orienta preservar escolha; MacDonald fundamenta considerar esforço. Nenhuma dessas fontes define a quota da IC. | Quantidade configurável, convite para contribuir e possibilidade de parar antes da meta. Definir tamanho/frequência no piloto. Observar compreensão, pressão percebida e esforço. |
| **Progresso pessoal** | Tornar visível a relação entre contribuição e meta; a relação pretendida com competência é uma interpretação da SDT. Sailer justifica conferir percepção da configuração, sem provar o efeito isolado de uma barra. | Mostrar total confirmado em relação à meta, com texto explicativo. Atualizar somente após recebimento e não duplicar reenvios técnicos. Verificar se a pessoa entende o indicador. |
| **Feedback motivacional breve** | Reconhecer participação e seu propósito; a SDT distingue informação de controle. Liu alerta para o custo de interações adicionais. | Mensagens como “Mais uma contribuição para sua meta. Obrigada por ajudar a pesquisa!”. Evitar bloqueios para aguardar animação, pressão por velocidade ou avaliação automática da pronúncia. Observar clareza, distração e tempo. |
| **Mesmo acesso e suporte nas duas condições** | Preservar participação e tornar a comparação interpretável. Procedimentos de coleta e orientações W3C apoiam especificar instruções, controle e recuperação de erros. | Ambas terão familiarização, pausa, encerramento, retomada e confirmação funcional de envio. Documentar ajuda e adaptações; diferenças de acessibilidade não constituirão o tratamento experimental. |

Fontes das justificativas: [Ryan e Deci](https://www.selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf), [Sailer](https://d-nb.info/1309619042/34), [MacDonald, seções 3.6–3.9](https://www.isca-archive.org/interspeech_2021/macdonald21_interspeech.pdf), [Liu](fichamentos/fichamento-liu-barakova-han-2024.md) e [correspondência com COGA/WCAG](revisao-bibliografica.md#acessibilidade-fundamentação-e-aplicações-propostas).

A confirmação “Áudio recebido” estará em ambas as condições. Na versão gamificada, a mensagem motivacional e o avanço em relação à meta compõem o tratamento adicional. Confirmar compreensão não exige retirar pessoas que tiveram dificuldade: registrar o problema e definir seu tratamento antes da coleta. A comparação avaliará o conjunto, sem identificar o efeito individual de cada elemento. Não se pretende testar pertencimento, autonomia ou competência como desfechos psicológicos sem instrumentos apropriados.

## Métricas: justificativa e interpretação

Mekler fundamenta separar produção e motivação; Liu reforça a distinção entre preferência, contribuição e custo de interação. As definições operacionais abaixo são propostas para a IC, não métricas validadas por esses artigos para o público a recrutar. [Mekler](fichamentos/fichamento-mekler-2017.md), [Liu](fichamentos/fichamento-liu-barakova-han-2024.md).

| Medida proposta | Definição a registrar no protocolo | Por que medir e limite |
| --- | --- | --- |
| **Contribuições confirmadas por pessoa** | Número de tarefas distintas com áudio recebido na janela de acompanhamento. Tentativas de regravação e reenvios técnicos da mesma tarefa não aumentam a contagem. | Indicador direto de contribuição; candidato a desfecho principal, ainda a fechar. Não mede motivação intrínseca ou utilidade para ASR. |
| **Duração total de áudio** | Somar a duração dos arquivos recebidos; apresentar também a duração tecnicamente aproveitável após verificação. | Complementa a contagem de frases com volume efetivo. Fala mais lenta pode produzir mais minutos sem maior engajamento. |
| **Dias ativos e retorno** | Dia ativo: ao menos um envio confirmado. Retorno: envio em dia posterior ao primeiro, dentro da janela. Informar dias observados e, para proporções de retorno, quem teve primeiro envio e oportunidade de retornar. | Observa continuidade além da primeira sessão. Sem primeiro envio ou sem tempo de acompanhamento não se deve classificar automaticamente como falta de retorno; descrever esses casos separadamente. |
| **Sessões** | Número de ocasiões de uso conforme regra única de início/fim, a fixar antes da coleta. | Descreve frequência. Muitas sessões podem decorrer de falhas ou interrupções; interpretar junto dos demais registros. |
| **Conclusão de tarefas** | Tarefas distintas com envio confirmado ÷ tarefas distintas iniciadas. Repetir tentativas não cria nova tarefa. Se nenhuma foi iniciada, razão não calculável. | Mostra dificuldade de concluir o fluxo. Informar também pessoas que não iniciaram e motivos conhecidos; atingir meta gamificada é uma medida separada. |
| **Experiência relatada** | Perguntas acessíveis sobre compreensão, esforço, vontade de continuar e dificuldades, com redação e codificação fixadas antes da coleta. Núcleo comum nas duas condições; perguntas sobre mecânicas somente como complemento. | Ajuda a interpretar os registros. Preferência, intenção de voltar e relato de motivação não equivalem a retorno observado nem constituem escala validada de motivação intrínseca. Registrar apoio e respostas por terceiros separadamente. |
| **Contexto e aproveitamento** | Registrar falhas de acesso/envio, ajuda e adaptações; classificar problemas técnicos por critérios prévios. Descrever distribuição por categoria quando o banco estiver definido. | Evita atribuir toda interrupção à gamificação. Categorias temáticas não demonstram cobertura fonética; características da fala de interesse não serão descartadas como erro técnico. |

**Medida complementar de custo:** se o registro de tempo de interação for confiável, apresentar tempo observado e envios por tempo separadamente do volume de áudio. Pausas não medidas e aplicativo aberto sem interação tornam esse indicador incompleto; não será usado para premiar rapidez.

Analisar por participante, com o mesmo período de observação e as mesmas oportunidades de acesso. Apresentar registros individuais e resumo por condição, incluindo perdas, ausência de início e dificuldades. As muitas gravações de uma pessoa não são participantes independentes. O desenho escolhido determinará como tratar medidas repetidas; uma amostra pequena não autoriza concluir eficácia por uma diferença descritiva ou ausência de significância. Se o banco se esgotar, registrar esse limite: o teto de tarefas pode ocultar diferenças de contribuição.

## Público, acessibilidade e material

O público continua em aberto, com recrutamento por indicação cogitado e expectativa de poucas pessoas. O perfil e o número não estão confirmados. Nenhum artigo desta revisão determina um mínimo estatístico para a IC. Se o acesso for muito restrito, discutir com a orientação uma avaliação exploratória de viabilidade e experiência, sem tratá-la como teste conclusivo da hipótese. O [guia do NCCIH](https://www.nccih.nih.gov/grants/pilot-studies-common-uses-and-misuses), usado como apoio contextual de pesquisa clínica, não define uma regra de amostra para este projeto.

As [orientações COGA e critérios WCAG selecionados](revisao-bibliografica.md#acessibilidade-fundamentação-e-aplicações-propostas) fundamentam compreensão, operação e controle da tarefa. Elas orientarão verificações no protótipo e com o público; não certificam sua acessibilidade. Fala atípica não implica as mesmas necessidades motoras, visuais, de leitura ou compreensão em todas as pessoas.

Para o material, comparar uso pretendido, vocabulário, extensão, dificuldade de leitura e esforço de fala. Conversação, automação e comunicação assistiva continuam candidatos. Definir e justificar categorias e proporções depois de conhecer o público; fechar o banco antes do piloto. Separar familiarização da avaliação, preservar a frase apresentada e registrar eventual transcrição do que foi efetivamente dito. Manter conteúdo e regra de apresentação equivalentes entre condições. [Critérios de composição e seus limites](fichamentos/fichamento-macdonald-2021.md).

## UX: diretrizes para refinar a interface

**Síntese complementar de 18/11/2026.** A [revisão de UX](revisao-bibliografica.md#ux-de-interfaces-gamificadas) reúne fontes, métodos e limites. A direção proposta é uma jornada de contribuições com metas compreensíveis, conquista visível e baixo esforço de operação. Duolingo continua como referência de interação solicitada pela estudante; a transferência para coleta de voz exige verificação própria.

Há três resultados diferentes a observar: **conseguir usar a plataforma**, **perceber uma experiência de jogo** e **contribuir/retornar efetivamente**. O UEQ-S e o GAMEFULQUEST ajudam a distinguir construtos; não tornam essas medidas equivalentes. [UEQ-S](https://serwiss.bib.hs-hannover.de/files/3398/schrepp_etal2017-ueq-s.pdf), [GAMEFULQUEST](https://www.utupub.fi/server/api/core/bitstreams/a037b7b5-cfe7-4b75-ae7f-771ccb969a13/content).

### O que manter e o que priorizar

Inspeção do código, documentação e capturas da versão 0.3 identificou missões, progresso confirmado, imagens, celebração, pausa e retomada. No celular, a trilha ocupava uma área relevante antes da frase, e o botão de gravação podia exigir rolagem. Isso motivou o refinamento; não representa dificuldade observada com participantes.

As linhas abaixo são **inferências de projeto para testar**, e não configurações comprovadas pelos artigos.

| Prioridade e aspecto | Base e estado atual | Próximo ajuste proposto |
| --- | --- | --- |
| **P0 — hierarquia da coleta** | W3C sobre tarefas importantes; trilha completa precede o gravador. | Dar mais espaço à frase, à imagem e à ação atual; experimentar um cabeçalho de missão com progresso compacto durante a coleta. Manter a trilha completa na entrada ou nas transições das missões, sem criar uma nova condição experimental. |
| **P0 — controle para continuar ou parar** | A pausa já existe; a celebração fica distante do botão superior. | Conferir se pausar e retomar são fáceis de encontrar também após um envio. Melhorias de operação devem beneficiar as duas condições. |
| **P1 — propósito e regras** | Tondello; há metas numéricas e mensagens breves. | Explicar uma vez o que significa a missão e como cada envio conta. Associar a contribuição à pesquisa sobre tecnologias de voz; manter cinco gravações como parâmetro de teste, sujeito ao piloto. |
| **P1 — conquista e feedback** | Já há confirmação funcional e celebração de missão. | Preservar feedback sobre participação e armazenamento, por exemplo “Missão concluída: cinco gravações salvas”. Conferir se a mensagem é entendida, se interrompe o fluxo e se a próxima ação fica clara. |
| **P1 — imagens e linguagem** | As ilustrações são iguais nas duas versões. | Conferir sentido, tom e distração. A imagem de amanhecer para “Amanhã será um novo dia” representa uma ideia abstrata: verificar interpretação. Revisar `alt` caso a imagem apenas repita a frase; preservar texto e operação quando ela falhar. |
| **P0 — avaliação da experiência** | A definição do instrumento está pendente. | Escolher uma medida breve de UX, se adequada, e poucas perguntas específicas sobre jogo e esforço. Verificar compreensão no dispositivo real antes da coleta. |

Fundamentação da hierarquia: [W3C — tarefas importantes](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o2p01-site-important/). Fundamentação de propósito e regras: [Tondello et al.](https://www.gamefulbits.com/wp-content/uploads/2019/05/Gameful-Design-Heuristics-preprint.pdf). Para imagens: [W3C — decisão sobre alternativas](https://www.w3.org/WAI/tutorials/images/decision-tree/). O estudo de [Li, Luo, Lowry e Zhang](https://vtechworks.lib.vt.edu/server/api/core/bitstreams/18a21e8a-8e08-4807-b4fa-7a86d97761f8/content) reforça investigar o esforço da camada de jogo; não demonstra que nossa proposta compacta reduzirá fadiga.

Uma composição a experimentar dentro das três telas existentes:

| Momento | Versão gamificada proposta |
| --- | --- |
| Entrada e início da missão | Propósito breve, trilha, missão atual, quantidade prevista e ação para começar. |
| Gravação e envio | Missão e progresso compactos; imagem e frase legíveis; controle do gravador e feedback do envio. Recursos de operação e apoio permanecem equivalentes na versão neutra. |
| Pausa e conclusão | Contribuições salvas, marco alcançado e opção clara de continuar ou encerrar. |

Essa proposta reorganiza a apresentação do conjunto existente. Recursos adicionais como pontuação, ranking, vidas, sequência diária ou dificuldade adaptativa exigiriam justificativa própria e revisão do escopo. Os achados de [Almeida et al.](https://arxiv.org/pdf/2305.08346) fundamentam investigar efeitos indesejados, sem classificar essas mecânicas como universalmente prejudiciais.

### Aplicação no protótipo em 18/11 — versão 0.4

| Aspecto | Refinamento implementado | O que verificar com o público |
| --- | --- | --- |
| Trilha | Caminho completo na apresentação da missão; progresso compacto durante a gravação. | Orientação e localização da ação de gravar. |
| Missões | Objetivo, quantidade prevista e contribuição à pesquisa explícitos. | Compreensão da meta e de como cada envio conta. |
| Feedback | Conquista e armazenamento confirmados; próximo passo explicado. | Entendimento, tom e interrupção do fluxo. |
| Controle | Continuar e pausar próximos após envio, nas duas condições. | Localização e liberdade para parar e retomar. |
| Imagens | Cenas preservadas; alternativa vazia quando a frase adjacente já comunica o conteúdo, evitando repetição. | Compreensão, distração e necessidade de informação alternativa adicional. |
| Avaliação | Perguntas opcionais independentes sobre facilidade, percepção de jogo e cansaço, além de imagens e comentário; salvamento e exportação por sessão. | Compreensão, acessibilidade e adequação do instrumento exploratório. |

As perguntas implementadas são autorais, identificadas como `ux-exploratorio-v1`; não são uma aplicação do UEQ-S ou GAMEFULQUEST. As três respostas de 1 a 5 têm sentidos próprios e não devem ser somadas. Cansaço se refere à sessão inteira e não identifica sua causa. A [documentação do protótipo](../prototipo/README.md#avaliação-exploratória) descreve campos, omissões e atualização das respostas. A implementação operacionaliza as inferências acima, sem demonstrar melhora de UX ou confirmar a hipótese. Não substitui a escolha final do instrumento no protocolo.

### Como verificar antes de fechar o desenho

Realizar um percurso exploratório no dispositivo previsto, permitindo parar a qualquer momento: entrar, compreender a tarefa, gravar, ouvir/regravar, enviar, pausar e retomar. Pedir comentários entre gravações, para não misturá-los aos áudios das frases. Registrar tarefa concluída, dúvidas, erros, ajuda recebida e motivos de pausa; separar falhas de interface, esforço de fala e intervalos voluntários.

Perguntas autorais candidatas para o piloto, com resposta oral entre tarefas, escrita ou outra forma acessível:

- “O que você precisa fazer agora?” — compreensão do próximo passo.
- “Como você sabe que a gravação foi enviada?” — entendimento do estado.
- “Em algum momento a atividade pareceu um jogo? O que fez você perceber isso?” — percepção exploratória após o uso, com redação comum às condições se for comparada.
- “O que facilitou ou dificultou continuar?” — esforço, interesse e barreiras.
- “Alguma imagem ou mensagem ajudou ou atrapalhou? Como?” — pertinência dos estímulos.

Essas perguntas não constituem uma escala validada e não devem gerar um escore de motivação intrínseca ou GAMEFULQUEST. A verificação do entendimento não será usada para excluir automaticamente quem teve dificuldade. Adaptar o modo de resposta e documentar apoios, sem presumir dificuldades cognitivas pela fala atípica. A nota de [Miller, consultada somente no resumo](https://www.jacces.org/index.php/jacces/article/view/513), reforça a importância de avaliar o instrumento de pesquisa, com alcance limitado.

O **UEQ-S é um candidato, não uma decisão de protocolo**: considerar seus oito itens se houver uma justificativa concreta para reduzir o esforço de resposta. Conferir a [versão oficial e ferramentas](https://www.ueq-online.org/), compreensão e forma de aplicação; não reformular itens e manter o mesmo rótulo de escala validada. Não se propõe acumular questionários longos. Usar os registros de uso para contribuição e retorno, e os relatos para interpretar a experiência. Preferência ou intenção de continuar não substitui retorno observado.

Antes do piloto, escolher a apresentação final e registrar versão, regras e mensagens. Preservar conteúdo, imagens, acesso e suporte equivalentes entre condições. Uma melhora geral de usabilidade será aplicada às duas; as metas, o progresso pessoal e o feedback adicional continuarão caracterizando o tratamento gamificado. Registrar desvios necessários ao acesso para interpretar a exposição às mecânicas.

**Ordem de execução recomendada:** refinar hierarquia e acesso à pausa; esclarecer propósito e regras; conferir compreensão e avaliação no público viável. Definição do público, banco e procedimentos institucionais continuam pendentes. Esta revisão não confirma a hipótese nem substitui o piloto.

## Contribuição proposta da IC

**Formulação para orientar a escrita:** esta IC propõe desenvolver e avaliar um protótipo acessível de coleta de voz com um conjunto explícito de metas, progresso e feedback, comparado ao mesmo fluxo sem esse conjunto. A contribuição será documentar a participação e a continuidade na janela curta de acompanhamento, relacionando os registros à experiência, ao esforço, às barreiras e ao apoio recebido no público efetivamente recrutado.

As entregas que concretizam essa contribuição são:

- Protótipo com duas condições comparáveis, regras das mecânicas e acessibilidade documentadas.
- Procedimento e registros que distingam contribuição confirmada, continuidade, experiência e aproveitamento técnico.
- Resultados e limitações contextualizados, inclusive ausência de aumento de participação ou necessidade de adaptar o desenho ao público disponível.

A contribuição é incremental e situada. O antecedente de Liu impede apresentar a ideia geral como inédita; a proposta da IC acrescenta uma configuração e uma avaliação próprias, cuja pertinência depende da execução do protocolo. Não promete corpus representativo, satisfação de necessidades psicológicas, maior cobertura fonética ou melhora de ASR. O relatório final deverá descrever o que foi efetivamente executado, inclusive se o desenho previsto mudar.

## Estado desta etapa e passagem ao protocolo

- [x] Completar Hasegawa-Johnson com objetivo, amostra, resultados, limitações e contribuição.
- [x] Concluir Deterding, Common Voice e Shor, condensando as notas no roteiro.
- [x] Revisar o alcance das fontes parciais, especialmente Howarth.
- [x] Justificar metas, progresso, feedback e métricas.
- [x] Consolidar a relação com a hipótese original e a contribuição proposta.
- [x] Acrescentar revisão de UX e prioridades de refinamento e avaliação, em 18/11.
- [x] Refinar disposição da missão, clareza das regras, acesso à pausa e alternativas das imagens; implementar avaliação exploratória opcional (18/11).
- [ ] Conferir compreensão do fluxo, imagens e perguntas com o público antes de fixar a versão do piloto.
- [ ] Revisar as interpretações com a estudante e a orientação.
- [ ] Definir público, acesso, tamanho viável e desenho da comparação.
- [ ] Fixar meta, janela de acompanhamento, regra de sessão, medida principal, instrumento e tratamento das observações incompletas.
- [ ] Fechar e justificar o banco e validar o fluxo no piloto, antes da coleta principal.

[Matriz comparativa](matriz-comparativa.md) · [Roteiro da revisão](revisao-bibliografica.md) · [Escopo e requisitos do protótipo](../escopo/escopo-estudo.md#requisitos-mínimos-do-protótipo).

