import type { Category } from '@/data/news';

export type DossierSource = {
  title: string;
  publisher: string;
  href: string;
};

export type Dossier = {
  slug: Category;
  committee: string;
  title: string;
  subtitle: string;
  summary: string;
  image: string;
  imageAlt: string;
  authors?: string;
  publishedAt?: string;
  readingTime?: string;
  paragraphs: string[];
  sources: DossierSource[];
};

export const dossiers: Dossier[] = [
  {
    slug: 'juridico',
    committee: 'Jurídico',
    title: 'Dossiê - Oppenheimer',
    subtitle: 'O que você precisa saber',
    summary:
      'O julgamento que expôs o conflito entre ciência, política, segurança nacional e o medo ideológico durante a Guerra Fria.',
    image: '/images/dossiers/oppenheimer.jpg',
    imageAlt: 'Ruínas de Hiroshima após o lançamento da bomba atômica',
    authors: 'Theo Abud, Joaquim Dias, Arthur Fidelis, Arthur Coelho',
    publishedAt: '12/08/2026, 08:27',
    readingTime: '5 min',
    paragraphs: [
      'O julgamento de J. Robert Oppenheimer ocorreu em 1954, durante a Guerra Fria e o Macarthismo. Após liderar o Projeto Manhattan, ele passou a defender o controle de armas nucleares, o que gerou desconfiança. Por suspeitas de ligação com o comunismo, perdeu sua autorização de segurança, marcando o conflito entre ciência, política e medo ideológico.',
      'O físico teve contato com ideias socialistas nos anos 1930 e início dos 1940, influenciado pela Grande Depressão e pelo antifascismo em Berkeley. Embora nunca tenha entrado oficialmente no Partido Comunista dos EUA, ele conviveu com pessoas ligadas ao partido e apoiou financeiramente causas de esquerda, como a República Espanhola na Guerra Civil Espanhola.',
      'Descobertas científicas sobre o átomo e a fissão nuclear, feitas por pesquisadores como Marie Curie e Enrico Fermi, possibilitaram a liberação de grande energia. Com medo do avanço nazista, Albert Einstein alertou Franklin D. Roosevelt, levando à criação do Manhattan Project. Sob liderança de Oppenheimer, o projeto desenvolveu a bomba atômica, cuja eficácia foi comprovada no Trinity Test.',
      'O caso envolveu Oppenheimer, seus acusadores dentro da Comissão de Energia Atômica, seus advogados, o painel julgador e cientistas que testemunharam. O centro da disputa era político e de segurança: antigas relações com pessoas ligadas ao comunismo e sua oposição à bomba de hidrogênio. Em 2022, o Departamento de Energia dos EUA anulou a decisão de 1954, afirmando que o processo foi falho e injusto.',
      'O julgamento de segurança ocorreu em 1954 diante da Comissão de Energia Atômica dos EUA para avaliar sua lealdade e confiabilidade política. O processo concentrou-se em suas antigas associações com membros do Partido Comunista e em sua oposição ao desenvolvimento da bomba de hidrogênio. Diversos relatos apontam que a audiência apresentou procedimentos abusivos e tratamento desigual das evidências.',
      'Em 1954, J. Robert Oppenheimer perdeu sua autorização de segurança após ser considerado um risco pela Comissão de Energia Atômica dos Estados Unidos, o que encerrou sua influência política.',
      'Seu julgamento resultou na cassação de sua autorização de segurança e encerrou sua atuação como conselheiro do alto escalão do governo dos EUA. Isso repercutiu no meio científico, levantando debates sobre política, moralidade e o papel dos cientistas no Estado. A divulgação dos documentos reforçou a percepção de que Oppenheimer foi prejudicado por um processo injusto e macarthista.',
    ],
    sources: [
      {
        title: 'In the Matter of J. Robert Oppenheimer, parte I',
        publisher: 'Avalon Project / Encyclopaedia Britannica',
        href: 'https://cdn.britannica.com/primary_source/avalon/20th_century/opp01.asp',
      },
      {
        title: 'In the Matter of J. Robert Oppenheimer, parte V',
        publisher: 'Avalon Project / Encyclopaedia Britannica',
        href: 'https://cdn.britannica.com/primary_source/avalon/20th_century/opp05.asp',
      },
      {
        title: 'Atomic Energy Commission',
        publisher: 'Encyclopaedia Britannica',
        href: 'https://www.britannica.com/topic/Atomic-Energy-Commission-United-States-organization',
      },
      {
        title: "'Destroyer of Worlds': The Making of an Atomic Bomb",
        publisher: 'The National WWII Museum',
        href: 'https://www.nationalww2museum.org/war/articles/making-the-atomic-bomb-trinity-test',
      },
      {
        title: 'Oppenheimer Security Hearing',
        publisher: 'Atomic Heritage Foundation',
        href: 'https://ahf.nuclearmuseum.org/ahf/history/oppenheimer-security-hearing/',
      },
      {
        title: 'Those Who Believed in Oppenheimer',
        publisher: 'Los Alamos National Laboratory',
        href: 'https://www.lanl.gov/media/publications/the-vault/1023-those-who-believed-in-oppenheimer',
      },
      {
        title: 'J. Robert Oppenheimer security hearing',
        publisher: 'Encyclopaedia Britannica',
        href: 'https://www.britannica.com/event/J-Robert-Oppenheimer-security-hearing',
      },
      {
        title: 'DOE releases Oppenheimer hearing transcripts',
        publisher: 'Atomic Heritage Foundation',
        href: 'https://ahf.nuclearmuseum.org/doe-releases-oppenheimer-hearing-transcripts/',
      },
    ],
  },
  {
    slug: 'csnu',
    committee: 'CSNU',
    title: 'Dossiê - Conflito entre Estados Unidos e Irã',
    subtitle: 'O que você precisa saber',
    summary:
      'As origens da tensão, a escalada militar de 2026 e os impasses envolvendo o programa nuclear, as sanções e o Estreito de Ormuz.',
    image: '/images/dossiers/eua-ira.jpeg',
    imageAlt: 'Bandeira do Irã em meio aos escombros de uma área atingida',
    publishedAt: 'Atualizado em 19/08/2026',
    paragraphs: [
      'A tensão entre Irã e Estados Unidos existe há décadas, desde a Revolução Iraniana de 1979, e se intensificou principalmente devido ao programa nuclear iraniano e às sanções impostas por Washington.',
      'Em 28 de fevereiro de 2026, EUA e Israel iniciaram ataques contra o Irã, dando início a uma guerra direta que também envolveu outros países e grupos da região. Em junho, os dois lados chegaram a um acordo provisório de cessar-fogo, mas ele entrou em colapso poucas semanas depois.',
      'Atualmente, em agosto de 2026, as negociações estão paralisadas. O principal impasse envolve o programa nuclear iraniano, as sanções americanas e o Estreito de Ormuz, importante rota mundial de petróleo que permanece fechada pelo Irã.',
    ],
    sources: [
      {
        title: 'Trump says no talks planned with Iran, Tehran says Strait of Hormuz still shut',
        publisher: 'Reuters',
        href: 'https://www.reuters.com/world/middle-east/trump-says-no-talks-planned-with-iran-tehran-says-strait-hormuz-still-shut-2026-08-18/',
      },
      {
        title: 'A timeline of the Iran conflict and talks aimed at ending it',
        publisher: 'Associated Press',
        href: 'https://apnews.com/article/iran-us-timeline-trump-hormuz-war-ceasefire-04da58cbae991183f8b52ef5bf615963',
      },
      {
        title: 'Iran and U.S. reach an initial deal to extend the ceasefire and open the Strait of Hormuz',
        publisher: 'PBS NewsHour',
        href: 'https://www.pbs.org/newshour/world/iran-and-u-s-reach-an-initial-deal-to-extend-the-ceasefire-and-open-the-strait-of-hormuz-but-challenges-remain',
      },
      {
        title: 'Iran, US make competing claims over control of Strait of Hormuz',
        publisher: 'Reuters',
        href: 'https://www.reuters.com/world/iran-says-strait-hormuz-is-under-its-control-fars-news-reports-2026-08-13/',
      },
    ],
  },
  {
    slug: 'historico',
    committee: 'Histórico',
    title: 'Dossiê - Guerra da Coreia',
    subtitle: 'O que você precisa saber',
    summary:
      'As origens do conflito, a divisão da península e o armistício que encerrou os combates sem estabelecer uma paz definitiva.',
    image: '/images/dossiers/guerra-da-coreia.jpg',
    imageAlt: 'Soldados durante a Guerra da Coreia',
    authors: 'Francisco Telles, Martin Franco e Taís Pessoa',
    publishedAt: '12/08/2026, 08:21',
    readingTime: '1 min',
    paragraphs: [
      'A Guerra da Coreia aconteceu entre 1950 e 1953 e foi um dos principais conflitos da Guerra Fria. Após a Segunda Guerra Mundial, a Coreia foi dividida em duas partes: a Coreia do Norte, de orientação comunista e apoiada pela União Soviética e, posteriormente, pela China, e a Coreia do Sul, capitalista e apoiada principalmente pelos Estados Unidos e pela ONU. Em 1950, a Coreia do Norte invadiu a Coreia do Sul, dando início à guerra. Durante o conflito, os dois lados avançaram e recuaram diversas vezes, causando milhões de mortes e grande destruição. Em 1953, foi assinado um armistício, encerrando os combates, mas sem estabelecer um tratado de paz definitivo. A fronteira entre os países ficou próxima ao paralelo 38, criando a Zona Desmilitarizada (DMZ). Assim, a guerra terminou sem um vencedor, e a Coreia permaneceu dividida em dois países com sistemas políticos e econômicos opostos, situação que continua até os dias atuais.',
    ],
    sources: [
      {
        title: 'The Korean War',
        publisher: 'BBC Bitesize',
        href: 'https://www.bbc.co.uk/bitesize/articles/zkfnrmn#z8yscxs',
      },
      {
        title: 'Guerra da Coreia',
        publisher: 'História do Mundo',
        href: 'https://www.historiadomundo.com.br/idade-contemporanea/guerra-da-coreia.htm',
      },
    ],
  },
];

export const getDossierBySlug = (slug: Category) =>
  dossiers.find((dossier) => dossier.slug === slug);
