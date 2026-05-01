export type Category = 'juridico' | 'csnu' | 'historico';

export type Article = {
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  author: string;
  date: string;
  readingTime: string;
  coverImage: string;
  featured?: boolean;
  content: string[];
};

export const categoryLabels: Record<Category, string> = {
  juridico: 'Jurídico',
  csnu: 'CSNU',
  historico: 'Histórico'
};

export const articles: Article[] = [
  {
    slug: 'parecer-legal-protecao-civis',
    title: 'Parecer jurídico define limites de intervenção para proteção de civis',
    subtitle: 'Comissão Jurídica do SIS consolida critérios de proporcionalidade e soberania no texto-base.',
    category: 'juridico',
    author: 'Helena Prado',
    date: '1 de maio de 2026',
    readingTime: '6 min',
    coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80',
    featured: true,
    content: [
      'Delegações da Comissão Jurídica aprovaram um parecer preliminar que delimita os cenários em que uma intervenção internacional pode ser considerada legítima no âmbito humanitário.',
      'O documento enfatiza a necessidade de autorização multilateral, análise de risco e avaliação contínua de impacto em civis, com foco na construção de precedentes coerentes para as próximas sessões.',
      'Especialistas convidados destacaram que a redação final deverá conciliar segurança coletiva e respeito ao princípio da não intervenção, mantendo linguagem técnica e executável.'
    ]
  },
  {
    slug: 'csnu-veto-e-negociacao',
    title: 'CSNU entra em impasse sobre veto e abre rodada de negociação noturna',
    subtitle: 'Blocos regionais divergem sobre proposta de corredor humanitário em zona de conflito.',
    category: 'csnu',
    author: 'Rafael Monteiro',
    date: '30 de abril de 2026',
    readingTime: '5 min',
    coverImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1400&q=80',
    featured: true,
    content: [
      'A sessão extraordinária do Conselho de Segurança simulou um cenário de crise de alta complexidade, com delegações permanentes defendendo interpretações distintas do mandato de missão de paz.',
      'Após sinalização de veto, a mesa diretora convocou consultas informais para buscar texto de compromisso com mecanismos de monitoramento e prazos objetivos.',
      'Analistas do SIS avaliam que o resultado da madrugada pode redefinir alianças e influenciar diretamente o discurso de abertura do próximo bloco.'
    ]
  },
  {
    slug: 'historico-crise-suez-licoes',
    title: 'Comitê Histórico revisita Crise de Suez para discutir escalada e contenção',
    subtitle: 'Delegados comparam decisões de 1956 com padrões diplomáticos contemporâneos.',
    category: 'historico',
    author: 'Marina Salles',
    date: '29 de abril de 2026',
    readingTime: '7 min',
    coverImage: 'https://images.unsplash.com/photo-1473186505569-9c61870c11f9?auto=format&fit=crop&w=1400&q=80',
    content: [
      'A mesa histórica propôs uma reconstrução cronológica da crise para avaliar pontos de ruptura na negociação entre potências, atores regionais e organismos multilaterais.',
      'Delegações destacaram como decisões logísticas e comunicação estratégica influenciaram o custo político de cada movimento, gerando paralelos com crises atuais.',
      'Ao final, um bloco de consenso parcial apontou a importância de canais de mediação contínua para evitar escaladas irreversíveis.'
    ]
  },
  {
    slug: 'juridico-direitos-refugiados',
    title: 'Debate sobre direitos de refugiados avança com minuta de garantias processuais',
    subtitle: 'Texto inclui proteção de menores e padronização de due process em triagens internacionais.',
    category: 'juridico',
    author: 'Caio Fernandes',
    date: '28 de abril de 2026',
    readingTime: '4 min',
    coverImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80',
    content: ['Após duas rodadas de emendas, a comissão consolidou princípios de acolhimento imediato e revisão jurídica independente para casos complexos.']
  },
  {
    slug: 'csnu-operacao-paz',
    title: 'Proposta de operação de paz recebe apoio condicionado no CSNU',
    subtitle: 'Mandato inclui cláusulas de transparência e proteção de infraestrutura civil crítica.',
    category: 'csnu',
    author: 'Bianca Leite',
    date: '27 de abril de 2026',
    readingTime: '5 min',
    coverImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
    content: ['Delegações exigiram indicadores de desempenho e relatórios quinzenais antes da votação final em plenário.']
  },
  {
    slug: 'historico-berlim-diplomacia',
    title: 'Histórico analisa Berlim e o papel da diplomacia de bastidores',
    subtitle: 'Narrativas concorrentes sobre legitimidade territorial marcam discursos do bloco europeu.',
    category: 'historico',
    author: 'Otávio Reis',
    date: '26 de abril de 2026',
    readingTime: '6 min',
    coverImage: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1400&q=80',
    content: ['A sessão destacou como acordos informais podem estabilizar crises quando combinados com mecanismos verificáveis.']
  }
];

export const getFeaturedArticles = () => articles.filter((article) => article.featured);

export const getRecentArticles = () => [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));

export const getArticlesByCategory = (category: Category) => articles.filter((article) => article.category === category);
