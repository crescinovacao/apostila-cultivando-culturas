/* ============================================================================
   DADOS DA APOSTILA  —  arquivo mantido à mão (é aqui que você mexe).

   Unidade das coordenadas: pontos PDF (A4 = 595,276 × 841,89), medidos a partir do
   canto superior esquerdo da página original.

   SECTIONS  -> grupos do menu lateral, com os nomes reais do Índice da apostila.
   PAGES     -> uma entrada por página (n = número da página no PDF/impresso):
       title   título real da página, usado no menu lateral
       fields  espaços do participante que CRESCEM com o texto
                 id      identificador estável (é a chave salva no navegador e no backup)
                 label   pergunta/rótulo original (leitores de tela)
                 top     onde o espaço começa
                 bottom  onde o espaço termina (altura mínima)
                 box     { color } quando o espaço é uma caixa desenhada no original
                         (as bordas laterais acompanham o crescimento do campo)
                 kind    'ruled' (pautado, para áreas abertas) | 'plain'
       checks  caixinhas ☐ impressas no original: { id, label, x, y, w, h }
       links   áreas clicáveis (só no Índice): { to, x, y, w, h }

   Para incluir uma atividade: acrescente um item em `fields` da página.
   Para trocar uma imagem: substitua assets/pages/pagina-NN.jpg (mesmo tamanho).
   ============================================================================ */

window.PAGE_W = 595.276;
window.PAGE_H = 841.89;
window.STORAGE_KEY = 'cultivando-culturas-apostila-v1';

window.SECTIONS = [
  { id: 'inicio',   title: null, from: 1,  to: 13 },
  { id: 'cva',      title: 'Avaliação de Valores Culturais & Análise de Relatório Principal — Manual', from: 14, to: 43 },
  { id: 'lider',    title: 'Liderança', from: 44, to: 46 },
  { id: 'mkt',      title: 'Marketing e precificação de vendas · Recursos e Contatos', from: 47, to: 56 },
  { id: 'caso',     title: 'Estudo de Caso: Visão Geral e Requisitos', from: 57, to: 60 },
  { id: 'vivo',     title: 'Atividades da sessão ao vivo', from: 61, to: 75 },
  { id: 'recursos', title: 'Mais Recursos', from: 76, to: 84 }
];

/* ---- helpers de campo --------------------------------------------------- */
const PURPLE = '#a261e1';   /* traço lilás das caixas das páginas 4, 62 e 63 */
const DARK = '#2d0051';     /* traço roxo-escuro das caixas "Observações" */

/* campo de uma caixa "Observações:" (rótulo no topo da caixa) */
function obs(page, boxTop, boxBottom, labelBottom) {
  return { id: 'p' + page + '-observacoes', label: 'Observações', top: labelBottom + 4, bottom: boxBottom - 1,
           box: { color: DARK }, kind: 'ruled' };
}
/* campo de uma página "Anotações:" (área aberta) */
function notas(page) {
  return { id: 'p' + page + '-anotacoes', label: 'Anotações', top: 100, bottom: 750, kind: 'ruled' };
}

window.PAGES = [
  { n: 1,  title: 'Capa' },
  { n: 2,  title: 'Índice',
    links: [
      { to: 14, x: 71, y: 234, w: 468, h: 20 },
      { to: 14, x: 71, y: 265, w: 468, h: 20 },
      { to: 44, x: 71, y: 295, w: 468, h: 20 },
      { to: 47, x: 71, y: 325, w: 468, h: 20 },
      { to: 47, x: 71, y: 356, w: 468, h: 20 },
      { to: 57, x: 71, y: 386, w: 468, h: 20 },
      { to: 61, x: 71, y: 416, w: 468, h: 20 },
      { to: 76, x: 71, y: 446, w: 468, h: 20 }
    ] },
  { n: 3,  title: 'Como usar seu guia' },

  { n: 4,  title: 'Introdução ao curso: Principais marcos',
    fields: [
      { id: 'p4-q1', label: 'Compartilhe um marco ou algo muito representativo que mudou a sua vida.', top: 163, bottom: 242.7, box: { color: PURPLE }, kind: 'ruled' },
      { id: 'p4-q2', label: 'Por que isso é relevante?', top: 268, bottom: 403.3, box: { color: PURPLE }, kind: 'ruled' },
      { id: 'p4-q3', label: 'O que mudou a partir desse acontecimento?', top: 428, bottom: 563.9, box: { color: PURPLE }, kind: 'ruled' },
      { id: 'p4-q4', label: 'Por qual transformação interna você passou?', top: 589, bottom: 725, box: { color: PURPLE }, kind: 'ruled' }
    ] },
  { n: 5,  title: 'Introdução às oficinas: Principais marcos',
    fields: [
      { id: 'p5-q1', label: 'Que tipo de valor é representado na sua história com esse marco?', top: 120, bottom: 252, kind: 'ruled' },
      { id: 'p5-q2', label: 'Quais foram/são as crenças?', top: 277, bottom: 409, kind: 'ruled' },
      { id: 'p5-q3', label: 'Quais são alguns comportamentos observáveis que você percebe na sua vida ao refletir sobre esses valores e as suas crenças?', top: 447, bottom: 748, kind: 'ruled' }
    ] },
  { n: 6,  title: 'Definição' },
  { n: 7,  title: 'Principais conceitos' },
  { n: 8,  title: 'Principais conceitos – Barrett Model' },
  { n: 9,  title: 'O Barrett Model™' },
  { n: 10, title: 'Definições' },
  { n: 11, title: 'Dois tipos de valores nos níveis 1 a 3' },
  { n: 12, title: 'Principais conceitos – Quatro jornadas de alinhamento' },
  { n: 13, title: 'Anotações', fields: [notas(13)] },

  { n: 14, title: 'Avaliação de Valores Culturais & Análise de Relatório Principal — Manual' },
  { n: 15, title: 'Avaliação de valores culturais' },
  { n: 16, title: 'Visão geral da abordagem' },
  { n: 17, title: 'Seção 1: Fundamentando-se na estrutura da análise', fields: [obs(17, 373, 708, 397)] },
  { n: 18, title: 'Seção 1: Fundamentando-se na estrutura da análise – Criando tem as e mensagens importantes' },
  { n: 19, title: 'Seção 2: O lado bom – Visão geral' },
  { n: 20, title: 'Seção 2: O lado bom – Resultados gerais do grupo (Diagramas de pontos)' },
  { n: 21, title: 'Seção 2: O lado bom – Os 10 principais valores da Cultura Atual (CA)' },
  { n: 22, title: 'Seção 2: O lado bom – Cultura Desejada (CD)' },
  { n: 23, title: 'Seção 2: O lado bom – Saltos de valores' },
  { n: 24, title: 'Seção 2: O lado bom – Visão ampliada e índice de equilíbrio' },
  { n: 25, title: 'Seção 2: O lado bom – Níveis vazios' },
  { n: 26, title: 'Seção 3: O possível lado ruim – Visão geral' },
  { n: 27, title: 'Seção 3: O possível lado ruim – Cultural Entropy®' },
  { n: 28, title: 'Seção 3: O possível lado ruim – Cultural Entropy® (cont.)' },
  { n: 29, title: 'Seção 4: Perspectivas Organizacionais' },
  { n: 30, title: 'Definições das subcategorias' },
  { n: 31, title: 'Nota da Cultura – O que você precisa saber' },
  { n: 32, title: 'Seção 4: E daí, e agora? – Criando a história' },
  { n: 33, title: 'Seção 4: E daí, e agora? – Apresentação ao cliente' },
  { n: 34, title: 'Estrutura da história' },
  { n: 35, title: 'Apresentando sua análise' },
  { n: 36, title: 'Apresentando ao líder' },
  { n: 37, title: 'Guia rápido de consulta para a Análise CVA' },
  { n: 38, title: 'Guia rápido de consulta para métricas' },
  { n: 39, title: 'Índice de equilíbrio' },
  { n: 40, title: 'Nomes e siglas das valiações' },
  { n: 41, title: 'Fluxo de Avaliação' },
  { n: 42, title: 'Avaliação de Fusão' },
  { n: 43, title: 'Anotações', fields: [notas(43)] },

  { n: 44, title: 'Liderança' },
  { n: 45, title: 'Liderança' },
  { n: 46, title: 'Fluxo de Avaliação' },

  { n: 47, title: 'Marketing e Vendas · Precificação · Recursos e Contatos' },
  { n: 48, title: 'Kit de ferramentas de marketing' },
  { n: 49, title: 'Mensagens do BVC' },
  { n: 50, title: 'Dicas de vendas' },
  { n: 51, title: 'Avaliação de Valores Pessoais com co-branding' },
  { n: 52, title: 'Criando um a proposta',
    checks: [
      { id: 'p52-c1', label: 'Número de possíveis respostas (define o preço)', x: 70.9, y: 120.2, w: 11, h: 11 },
      { id: 'p52-c2', label: 'Cortes de dados mais importantes com base nos objetivos do projeto', x: 70.9, y: 152, w: 11, h: 11 },
      { id: 'p52-c3', label: 'Tempo necessário para que você faça a análise (mais cortes de dados, mais tempo)', x: 70.9, y: 183.9, w: 11, h: 11 },
      { id: 'p52-c4', label: 'Expectativa de entrega de resultados (considerar conversa com líder; conversa com equipe)', x: 70.9, y: 215.7, w: 11, h: 11 },
      { id: 'p52-c5', label: 'Posicionamento como uma abordagem por fases Diagnosticar e alinhar prioridades; criar planos de ação e de implementação.', x: 70.9, y: 260.4, w: 11, h: 11 }
    ] },
  { n: 53, title: 'Elaborar orçamento e apresentar cronogramas' },
  { n: 54, title: 'Preço para parceiros para novos consultores BVC' },
  { n: 55, title: 'Preço para parceiros: Perguntas frequentes (FAQs)' },
  { n: 56, title: 'Olhando para o futuro' },

  { n: 57, title: 'Estudo de Caso: Visão Geral e Requisitos' },
  { n: 58, title: 'Estudo de Caso' },
  { n: 59, title: 'Processo de explicação do estudo de caso',
    checks: [
      { id: 'p59-c1', label: 'Use o Guia resumido da CVA como uma checklist para garantir que considerou todos os dados.', x: 70.9, y: 306.4, w: 11, h: 11 },
      { id: 'p59-c2', label: 'Você tem uma narrativa que fundamente os dados x opinião? Conteste as suposições e os julgamentos que você possa estar impondo (das suas próprias experiências)', x: 70.9, y: 338.2, w: 11, h: 11 },
      { id: 'p59-c3', label: 'Que suporte a equipe pode dar a esse cliente para agir com base nas descobertas?', x: 70.9, y: 370.1, w: 11, h: 11 }
    ] },
  { n: 60, title: 'Anotações', fields: [notas(60)] },

  { n: 61, title: 'Atividades da sessão ao vivo' },
  { n: 62, title: 'Introdução às oficinas',
    fields: [
      { id: 'p62-q1', label: 'Qual tem sido um marco fundamental na sua vida?', top: 163, bottom: 242.7, box: { color: PURPLE }, kind: 'ruled' },
      { id: 'p62-q2', label: 'Por que isso é relevante?', top: 268, bottom: 403.3, box: { color: PURPLE }, kind: 'ruled' },
      { id: 'p62-q3', label: 'O que mudou ao alcançar esse marco?', top: 428, bottom: 563.9, box: { color: PURPLE }, kind: 'ruled' },
      { id: 'p62-q4', label: 'Por qual transformação interna você passou?', top: 589, bottom: 725, box: { color: PURPLE }, kind: 'ruled' }
    ] },
  { n: 63, title: 'Valores, crenças e comportamentos',
    fields: [
      { id: 'p63-q1', label: 'Que tipo de valor é representado na sua história com esse marco?', top: 188, bottom: 268, box: { color: PURPLE }, kind: 'ruled' },
      { id: 'p63-q2', label: 'Quais eram/são as crenças que você tinha/tem em relação a esse valor?', top: 293, bottom: 428.7, box: { color: PURPLE }, kind: 'ruled' },
      { id: 'p63-q3', label: 'Como elas se refletem nas suas ações? Liste alguns comportamentos observáveis', top: 466, bottom: 751, box: { color: PURPLE }, kind: 'ruled' }
    ] },
  { n: 64, title: 'Jogo de valores interativos – Grupos', fields: [obs(64, 381, 674, 406)] },
  { n: 65, title: 'Barrett Model – Prática de explicação do modelo', fields: [obs(65, 289, 624, 314)] },
  { n: 66, title: 'Exemplo de explicação do modelo' },
  { n: 67, title: 'Atividade: Desafio dos 2 minutos', fields: [obs(67, 280, 615, 305)] },
  { n: 68, title: 'Discussão sobre a definição de cultura', fields: [obs(68, 474, 700, 499)] },
  { n: 69, title: 'Temas da Cultura Desejada', fields: [obs(69, 352, 578, 377)] },
  { n: 70, title: 'Página do diagrama de pontos', fields: [obs(70, 352, 578, 377)] },
  { n: 71, title: 'Estudo de Caso', fields: [obs(71, 352, 578, 377)] },
  { n: 72, title: 'Temas de VPLs', fields: [obs(72, 352, 578, 377)] },
  { n: 73, title: 'Estudo de caso', fields: [obs(73, 352, 578, 377)] },
  { n: 74, title: 'Análise CVA', fields: [obs(74, 352, 578, 377)] },
  { n: 75, title: 'O papel da liderança – Discussão em pares', fields: [obs(75, 352, 578, 377)] },

  { n: 76, title: 'Mais recursos' },
  { n: 77, title: 'O processo de transformação do BVC' },
  { n: 78, title: 'Visão geral das etapas do processo de transformação' },
  { n: 79, title: 'Suporte teórico para o Barrett Model' },
  { n: 80, title: 'Teoria da autodeterminação (TDA)' },
  { n: 81, title: 'Bem-estar psicológico (BEP)' },
  { n: 82, title: 'Florescimento humano' },
  { n: 83, title: 'Bem-estar eudaimônico' },
  { n: 84, title: 'O Barrett Model e o alcance do potencial humano' }
];
