export type LandingSectionKey =
  | "hero"
  | "lifestyle"
  | "courses"
  | "stats"
  | "showcase"
  | "team"
  | "history";

export type LandingColor =
  | "accent"
  | "accent-soft"
  | "accent-deep"
  | "light-purple"
  | "light-purple-soft"
  | "light-purple-deep"
  | "warning-red"
  | "warning-red-soft"
  | "warning-red-deep";

export type LandingIcon =
  | "music"
  | "users"
  | "trophy"
  | "mic"
  | "star"
  | "headphones"
  | "radio"
  | "disc"
  | "sparkles"
  | "graduation-cap"
  | "calendar"
  | "map-pin"
  | "heart"
  | "zap"
  | "target"
  | "award";

export type HeroLandingData = {
  title: string;
  description: string;
  tags: string[];
};

export type LifestyleLandingData = {
  badge: string;
  title: string;
  description: string;
  items: string[];
  images: { image: string; label: string }[];
};

export type CourseLandingItem = {
  id: string;
  color: LandingColor;
  label: string;
  title: string;
  description: string;
  image: string;
  items: string[];
};

export type CoursesLandingData = { courses: CourseLandingItem[] };

export type StatsLandingData = {
  label: string;
  title: string;
  items: {
    id: string;
    color: LandingColor;
    icon: LandingIcon;
    value: string;
    title: string;
    description: string;
  }[];
};

export type ShowcaseLandingData = {
  image: string;
  imageLabel: string;
  label: string;
  title: string;
  description: string;
  items: { icon: LandingIcon; text: string }[];
};

export type TeamLandingData = {
  label: string;
  title: string;
  description: string;
  members: {
    id: string;
    color: LandingColor;
    image: string;
    name: string;
    role: string;
    description: string;
  }[];
};

export type HistoryLandingData = {
  label: string;
  title: string;
  description: string;
  items: { title: string; description: string }[];
};

export type LandingSectionDataMap = {
  hero: HeroLandingData;
  lifestyle: LifestyleLandingData;
  courses: CoursesLandingData;
  stats: StatsLandingData;
  showcase: ShowcaseLandingData;
  team: TeamLandingData;
  history: HistoryLandingData;
};

export type LandingSectionData = LandingSectionDataMap[LandingSectionKey];

export type LandingSectionContent<K extends LandingSectionKey = LandingSectionKey> = {
  key: K;
  data: LandingSectionDataMap[K];
};

export const landingColorOptions: readonly {
  value: LandingColor;
  label: string;
  color: string;
  gradient: string;
}[] = [
  { value: "accent", label: "Verde", color: "var(--djon-color-accent)", gradient: "from-djon-accent/15 via-djon-accent/5 to-transparent" },
  { value: "accent-soft", label: "Verde claro", color: "color-mix(in srgb, var(--djon-color-accent) 78%, white)", gradient: "from-djon-accent/20 via-djon-accent/8 to-transparent" },
  { value: "accent-deep", label: "Verde profundo", color: "color-mix(in srgb, var(--djon-color-accent) 72%, black)", gradient: "from-djon-accent/12 via-djon-accent/4 to-transparent" },
  { value: "light-purple", label: "Roxo claro", color: "var(--djon-color-light-purple)", gradient: "from-djon-light-purple/15 via-djon-light-purple/5 to-transparent" },
  { value: "light-purple-soft", label: "Roxo suave", color: "color-mix(in srgb, var(--djon-color-light-purple) 78%, white)", gradient: "from-djon-light-purple/20 via-djon-light-purple/8 to-transparent" },
  { value: "light-purple-deep", label: "Roxo profundo", color: "color-mix(in srgb, var(--djon-color-light-purple) 72%, black)", gradient: "from-djon-light-purple/12 via-djon-light-purple/4 to-transparent" },
  { value: "warning-red", label: "Vermelho", color: "var(--djon-color-warning-red)", gradient: "from-djon-warning-red/15 via-djon-warning-red/5 to-transparent" },
  { value: "warning-red-soft", label: "Vermelho claro", color: "color-mix(in srgb, var(--djon-color-warning-red) 78%, white)", gradient: "from-djon-warning-red/20 via-djon-warning-red/8 to-transparent" },
  { value: "warning-red-deep", label: "Vermelho profundo", color: "color-mix(in srgb, var(--djon-color-warning-red) 72%, black)", gradient: "from-djon-warning-red/12 via-djon-warning-red/4 to-transparent" },
];

export const landingIconOptions: readonly { value: LandingIcon; label: string }[] = [
  { value: "music", label: "Música" },
  { value: "users", label: "Pessoas" },
  { value: "trophy", label: "Troféu" },
  { value: "mic", label: "Microfone" },
  { value: "star", label: "Estrela" },
  { value: "headphones", label: "Fones" },
  { value: "radio", label: "Rádio" },
  { value: "disc", label: "Disco" },
  { value: "sparkles", label: "Destaque" },
  { value: "graduation-cap", label: "Formação" },
  { value: "calendar", label: "Calendário" },
  { value: "map-pin", label: "Local" },
  { value: "heart", label: "Coração" },
  { value: "zap", label: "Energia" },
  { value: "target", label: "Objetivo" },
  { value: "award", label: "Prêmio" },
];

export const landingDefaults: LandingSectionDataMap = {
  hero: {
    title: "SEU SONHO\nCOMEÇA AQUI!",
    description: "Nós somos a fronteira entre o sonho e a realização. Se o seu sonho é ser DJ ou Produtor Musical, a DJ ON Academy vai descomplicar tudo para você.",
    tags: ["Formação DJ", "Produção Musical", "Mentoria de Marketing", "Evento Showcase"],
  },
  lifestyle: {
    badge: "BEM-VINDO!",
    title: "A FRONTEIRA ENTRE O SONHO E A REALIZAÇÃO",
    description: "Nós somos a fronteira entre o sonho e a realização! Se o seu sonho é ser DJ ou Produtor Musical, a DJ ON Academy vai descomplicar tudo para você chegar cada vez mais perto dos seus objetivos!",
    items: ["Aprenda com profissionais da cena eletrônica", "Metodologia prática e teórica completa", "Turmas pequenas com atenção individualizada", "Comunidade ativa após a formação"],
    images: [
      { image: "/images/djon-course-dj.png", label: "Formação DJ" },
      { image: "/images/djon-course-producao.png", label: "Produção Musical" },
      { image: "/images/djon-course-marketing.png", label: "Marketing" },
      { image: "/images/djon-showcase.png", label: "Mentoria" },
    ],
  },
  courses: {
    courses: [
      { id: "formacao-dj", color: "accent", label: "Do Zero ao Profissional", title: "Formação DJ", description: "Aqui você vai aprender tudo que precisa para se tornar um DJ. Por hobby ou profissão, nossa metodologia prática e teórica abrange tudo o que você vai precisar para discotecar de maneira profissional e com confiança.", image: "/images/djon-course-dj.png", items: ["Mixagem de Música Eletrônica", "Todas as funções do mixer e do CDJ", "Play Match e Beat Match", "Mixagem com fone de ouvido", "Pitch e BPM / Frequências", "Software Rekordbox & Mixed in Key", "Elaboração de repertório", "Introdução ao marketing"] },
      { id: "producao-musical", color: "light-purple", label: "Do Beat à Track Final", title: "Produção Musical", description: "O curso de produção musical vai elevar suas habilidades criativas e transformar sua paixão pela música em resultados extraordinários. Explore técnicas incríveis e domine as ferramentas indispensáveis.", image: "/images/djon-course-producao.png", items: ["Software Ableton Live 11", "Construção da sua primeira track do zero", "Construção de baterias", "Arranjo / Storytelling", "Basslines & Síntese", "Teoria musical", "VSTs & Processamentos"] },
      { id: "mentoria-marketing", color: "warning-red", label: "Construa sua Carreira", title: "Mentoria de Marketing", description: "A mentoria de marketing especializada para DJs vai impulsionar sua carreira e expandir sua presença no mercado da música eletrônica. Aprenda a promover sua imagem e conquistar novas oportunidades.", image: "/images/djon-course-marketing.png", items: ["Mindset de artista", "Dominar as redes sociais", "Conquistar novos contratantes", "Como ter uma agenda lotada", "Performance de palco", "Plano de carreira", "Comunicação & Produza seu primeiro evento"] },
    ],
  },
  stats: {
    label: "A ACADEMIA",
    title: "DJ ON em Números",
    items: [
      { id: "modules", color: "accent", icon: "music", value: "3", title: "Módulos de Curso", description: "DJ, Produção Musical e Marketing" },
      { id: "students", color: "light-purple", icon: "users", value: "+1000", title: "Alunos Formados", description: "DJs e produtores prontos para o mercado" },
      { id: "founded", color: "warning-red", icon: "trophy", value: "2018", title: "Fundada em", description: "8 anos de experiência formando talentos" },
    ],
  },
  showcase: {
    image: "/images/djon-showcase.png",
    imageLabel: "EVENTO OFICIAL",
    label: "EVENTO OFICIAL DA DJ ON",
    title: "SHOWCASE",
    description: "Aqui, depois de formado, você terá a oportunidade de sentir a experiência de tocar num palco real, expandindo as suas possibilidades de networking e iniciando a sua base de fãs!\n\nVocê será preparado durante o curso para chegar confiante, com seu Set pronto e todas as dicas necessárias para arrasar na sua primeira performance!",
    items: [{ icon: "mic", text: "Palco Real" }, { icon: "star", text: "Primeira Performance" }, { icon: "users", text: "Networking" }, { icon: "music", text: "Set Completo" }],
  },
  team: {
    label: "QUEM FAZ ACONTECER",
    title: "Nosso Time",
    description: "Esse é o time de profissionais que vai te acompanhar durante a grande jornada rumo ao seu sonho. Cada professor traz consigo uma bagagem única de experiência, talento e paixão pela música eletrônica.",
    members: [
      { id: "segredo", color: "accent", image: "/images/djon-team-segredo.png", name: "Segredo", role: "Diretor, DJ, Produtor Musical", description: "Professor Curso Formação de DJ e Produção Musical" },
      { id: "kampff", color: "light-purple", image: "/images/djon-team-kampff.png", name: "Kampff", role: "DJ, Adm e Professor", description: "Curso Formação DJ e Mentor de Marketing para DJs" },
      { id: "xinddy", color: "warning-red", image: "/images/djon-team-xinddy.png", name: "Xinddy", role: "DJ, Produtora Musical", description: "Professora Curso Formação DJ (Psytrance) e Designer" },
      { id: "guilherme", color: "accent", image: "/images/djon-team-gui.png", name: "Guilherme", role: "DJ e Gestor", description: "Gestão e suporte aos alunos da academia" },
    ],
  },
  history: {
    label: "QUEM SOMOS",
    title: "NOSSA\nHISTÓRIA.",
    description: "A DJ ON foi criada em 2018 e iniciou atividades em 2019 para atender a demanda de pessoas interessadas em aprender de forma técnica e profissional sobre a profissão de DJ.\n\nA proposta era facilitar o ensino para iniciantes, proporcionando uma jornada acessível e divertida. Com a formação em turmas, os alunos têm a oportunidade de se conectar, colaborar em projetos e eventos, e receber acompanhamento intensivo para dominar as habilidades necessárias.\n\nA DJ ON funciona como uma academia, oferecendo suporte contínuo aos alunos. Mesmo depois de formados, os alunos têm acesso à infraestrutura da escola para treinar, além da possibilidade de tocar nos eventos que a escola organiza, mantendo-se assim a grande comunidade da DJ ON Academy.",
    items: [{ title: "2018", description: "Fundação da DJ ON" }, { title: "2019", description: "Início das atividades" }, { title: "2022", description: "Expansão dos cursos" }, { title: "2024", description: "Novo espaço e equipe" }],
  },
};

export function landingColor(value: LandingColor) {
  return landingColorOptions.find((item) => item.value === value) ?? landingColorOptions[0];
}
