# Protótipo de coleta de voz

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Decisão de implementação para esta entrega: Node.js 22.15 ou superior, SQLite integrado, HTML, CSS e JavaScript. Execução local; publicação não solicitada. Manter as instruções de uso no README do protótipo.

## Users

Estudante desenvolvendo a IC e, futuramente, participantes com fala atípica e diferentes necessidades de acesso. Público e amostra ainda em aberto. Esta entrega usa códigos e frases de teste.

## Product Purpose

Implementar o fluxo frase → gravar → ouvir/regravar → enviar → confirmar armazenamento. Duas condições equivalentes, neutra e gamificada, permitirão uma avaliação posterior do conjunto de metas, progresso e feedback.

Refinamento em 18/11/2026, após a estudante pedir uma gamificação mais aparente, com Duolingo como referência: na condição gamificada, metas são apresentadas como missões curtas, progresso como trilha e barra, e feedback inclui uma celebração visual estática ao concluir. Essa referência orienta a interação, sem afirmar eficácia para o público da IC.

A pedido da estudante, cada frase de teste recebe uma ilustração contextual, inclusive na familiarização. O mesmo apoio visual aparece nas duas condições, com texto integral separado da imagem. Cenas que repetem a frase usam alternativa vazia para evitar leitura duplicada; as descrições originais ficam no manifesto. Imagens indisponíveis não impedem a gravação. A compreensão e a adequação desse apoio ao público seguem a verificar no piloto.

Na versão 0.4, a trilha completa aparece na apresentação da missão, com objetivo, quantidade e contribuição à pesquisa; durante a gravação, fica um progresso compacto. Após cada envio, o próximo passo e a pausa ficam juntos. O resumo oferece avaliação opcional com respostas independentes sobre facilidade, percepção de jogo, cansaço e imagens. São perguntas autorais exploratórias, ainda sujeitas ao piloto e à definição do protocolo.

## Capabilities and Constraints

Três telas: entrada/instruções, coleta, resumo. Retomada, identificação de familiarização, armazenamento real e exportação local. Meta configurável; cinco é somente valor inicial para testes. Mesma sequência e acesso nas duas condições. Sem seleção adaptativa, treinamento de ASR ou avaliação automática da pronúncia. A pesquisa com participantes e o protocolo não estão aprovados por esta implementação.

## Evidence on Hand

Escopo e decisões em [escopo/escopo-estudo.md](escopo/escopo-estudo.md). Fundamentação em [revisao-bibliografica/sintese-inicial.md](revisao-bibliografica/sintese-inicial.md). Protótipo local implementado, com testes técnicos sintéticos; sem resultados de coleta com participantes. A versão 0.2 ampliou as missões, a 0.3 acrescentou imagens e a 0.4 aplica os refinamentos da revisão de UX. Proveniência e prompts reunidos em [prototipo/phrase-images.json](prototipo/phrase-images.json).

## Product Principles

- Priorizar o controle do participante e a compreensão da tarefa.
- Contar somente envios confirmados e não duplicar reenvios técnicos.
- Preservar condições equivalentes e separar dados de teste.
- Documentar limites e manter parâmetros ajustáveis.

## Accessibility & Inclusion

Português, rótulos explícitos, teclado, foco visível, estados anunciados, sem pressão de tempo ou animações decorativas. Verificações técnicas não substituem avaliação com o público.
