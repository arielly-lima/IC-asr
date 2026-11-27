# Escrita livre — ponto de partida da IC

## Rascunho revisado

Minha iniciação científica investiga como mecanismos de gamificação podem incentivar a participação de pessoas com fala atípica na coleta de dados de voz. Esses dados podem apoiar pesquisas futuras de reconhecimento automático de fala, conhecido pela sigla ASR, do inglês *Automatic Speech Recognition*. No recorte atual, o foco é desenvolver e avaliar a interface de coleta e suas mecânicas de gamificação; o treinamento ou ajuste fino de modelos de ASR permanece como trabalho futuro.

Sistemas de ASR convertem fala em texto. Seu desempenho pode ser prejudicado quando os padrões de fala de uma pessoa estão pouco representados nos dados usados no treinamento. Isso pode dificultar o uso de transcrição e interfaces por voz. Essa limitação varia entre sistemas e pessoas: já existem pesquisas de adaptação para fala atípica, como a personalização de modelos investigada por [Shor e colaboradores (2019)](https://www.isca-archive.org/interspeech_2019/shor19_interspeech.pdf).

Essa questão se relaciona à acessibilidade da comunicação. A Comunicação Aumentativa e Alternativa (CAA) reúne recursos que complementam ou substituem a fala, como gestos, pranchas de símbolos e dispositivos com saída de voz. Um sistema de reconhecimento pode integrar uma solução de apoio, mas a CAA é mais ampla e não depende necessariamente de ASR. Portanto, a contribuição pretendida da IC se concentra em uma etapa desse contexto: a coleta de voz. [Referência conceitual: ASHA — CAA](https://www.asha.org/njc/aac/).

O público ainda precisa ser delimitado. Alterações motoras da fala podem estar associadas, por exemplo, à paralisia cerebral, a sequelas de AVC ou a doenças degenerativas, como ELA e Parkinson. Esses casos não representam um perfil único de participação. Também considero o autismo, presente na proposta original, mas preciso distinguir características da fala, da linguagem e da comunicação, sem presumir necessidades apenas pelo diagnóstico ou nível de suporte. A definição do público deverá considerar a tarefa de gravação e os apoios necessários. [ASHA — disartria](https://www.asha.org/practice-portal/clinical-topics/dysarthria-in-adults/); [ASHA — autismo](https://www.asha.org/practice-portal/clinical-topics/autism/).

Meu interesse pelo tema surgiu da curiosidade despertada pela série documental *The Age of AI*, especialmente pelo episódio que mencionei como [“Cura através da IA”](https://www.youtube.com/watch?v=V5aZjsWM2wo). O Project Euphonia, do Google, tornou-se uma referência para entender iniciativas voltadas a tornar o reconhecimento de fala mais acessível. O projeto reuniu contribuições de pessoas com fala não padrão para apoiar essa pesquisa. Na consulta realizada em 26/11/2026, sua página oficial informa que não busca novas amostras e disponibiliza recursos de código aberto para outros pesquisadores e desenvolvedores. [FAQ oficial do Euphonia](https://sites.research.google/euphonia/about/faq/).

Entre esses recursos está o *Project Euphonia Audio Tool*, uma implementação de referência de coleta de áudio pela web. O código pode servir de base para adaptações, mas seu repositório está arquivado desde 26/08/2025 e não é um produto oficialmente suportado pelo Google. A possibilidade de adaptação para português não significa que a ferramenta esteja pronta ou validada para esse uso. [Repositório oficial](https://github.com/google/project-euphonia-audiotool).

Quero aprofundar a compreensão de como o Euphonia organizou a coleta, apoiou os participantes e verificou as gravações. Seu estudo de 2025 descreve procedimentos de gravação, revisão de transcrições e identificação de problemas técnicos. Essas experiências podem orientar decisões da minha interface, sem pressupor a adoção do código do Google. [Estudo do Euphonia, seções 3.2–3.3](https://www.frontiersin.org/journals/language-sciences/articles/10.3389/flang.2025.1569448/full).

O desafio que pretendo enfrentar é facilitar a contribuição de dados de voz em uma atividade repetitiva. Não posso presumir uma quantidade universal de áudio por pessoa: há resultados de personalização com dados limitados em condições específicas. Custos e viabilidade continuam como questões a investigar. [Shor e colaboradores (2019)](https://www.isca-archive.org/interspeech_2019/shor19_interspeech.pdf).

Nesse contexto, pretendo investigar a hipótese de que metas, progresso e feedback podem aumentar o engajamento na coleta de voz. A comparação proposta é entre uma versão neutra e uma gamificada, observando principalmente as contribuições voluntárias confirmadas por participante. O retorno poderá ser investigado se houver acompanhamento ao longo dos dias; uma sessão isolada permite estudar a participação imediata. Espero produzir uma avaliação que mostre em quais condições essas mecânicas ajudam, não apresentam benefício observado ou acrescentam dificuldades. O resultado poderá apoiar ou não a hipótese inicial, dentro dos limites do estudo.

## Desafios acrescentados para investigação

Sugestões técnicas relacionadas ao [escopo atual](../escopo/escopo-estudo.md), para a estudante avaliar e incorporar ao seu raciocínio:

- **Esforço e acesso:** verificar compreensão das frases, operação dos controles, necessidade de apoio e cansaço, permitindo pausa e encerramento.
- **Integridade da coleta:** detectar falhas de microfone ou envio, evitar duplicações e manter cada áudio associado à frase apresentada. Baixo reconhecimento por um ASR genérico não deve ser confundido com gravação tecnicamente inválida.
- **Comparação das versões:** manter frases, imagens, instruções e suporte equivalentes, para interpretar diferenças relacionadas ao conjunto de mecânicas.
- **Participação ao longo do tempo:** se escolhido o teste de uma semana, garantir acesso à plataforma e registrar falhas, apoio e lembretes que possam influenciar o retorno.
- **Utilidade dos dados:** distinguir quantidade coletada de qualidade técnica, diversidade e desempenho futuro de ASR; a IC não medirá todos esses resultados.

## Pontos conferidos e limites da revisão

| Ponto do rascunho | Ajuste e fundamento |
| --- | --- |
| “ASR não é acessível para pessoas com fala não padrão.” | Substituído por uma limitação de desempenho que depende do sistema e do perfil de fala. A existência de pesquisas de personalização impede essa generalização. [Shor et al.](https://www.isca-archive.org/interspeech_2019/shor19_interspeech.pdf). |
| “Autismos com níveis mais elevados” e “ELA?” | Separadas características de fala, linguagem e comunicação. ELA é uma doença neurodegenerativa progressiva; AVC é um evento vascular que pode deixar sequelas. Os diagnósticos citados são exemplos, não critérios de inclusão já definidos. [ASHA — autismo](https://www.asha.org/practice-portal/clinical-topics/autism/); [NINDS — ELA](https://www.ninds.nih.gov/sites/default/files/2025-05/NINDS_ALS_Booklet_Digital-508c.pdf). |
| Coleta encerrada e ferramenta aberta do Euphonia. | Confirmados na FAQ e no repositório; acrescentado o arquivamento e delimitada a possibilidade de adaptação. Não foi realizada auditoria do código nem teste de implantação. |
| “É preciso um grande conjunto por pessoa; é caro e inviável.” | Generalização retirada. Não foi localizada nesta revisão uma estimativa de custo aplicável à IC. |
| Documentário como origem da ideia. | Preservado como relato pessoal e referência de inspiração. O vídeo não pôde ser consultado diretamente nesta revisão; cenas, falas e sua relação específica com o Euphonia precisam ser conferidas antes de citações factuais. |

## Pontos para aprofundar pela estudante

Estas perguntas retomam motivação, referências, desafios e expectativas, como proposto na p. 1 do guia:

1. **Motivação:** qual cena ou problema do documentário despertou sua curiosidade? O que fez você escolher a coleta gamificada como contribuição possível?
2. **Público:** com quem é viável trabalhar, quais características de fala são relevantes e quais apoios serão necessários para compreender e realizar a tarefa?
3. **Dificuldade de coleta:** quais evidências da revisão relacionam repetição, esforço ou barreiras da interface à participação? Que parte desse problema as mecânicas escolhidas podem enfrentar?
4. **Comparação e experiência:** será uma sessão ou uma semana? Se interesse, cansaço e pressão forem avaliados, como essas informações serão obtidas, considerando que as perguntas ainda estão em discussão?
5. **Custos:** a preocupação é com tempo dos participantes, apoio à coleta, transcrição, infraestrutura ou treinamento? Quantificar apenas o que for pertinente ao recorte e houver dados para sustentar.

O roteiro de [testes](testes.md) mantém as alternativas em discussão. Esta revisão de escrita não define o público, escolhe o protocolo ou amplia o escopo para treinamento de ASR.
