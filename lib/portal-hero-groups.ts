import type {
  PortalHeroContent,
  PortalHeroKey,
} from "@/lib/store";

export type PortalHeroDefaults = Omit<PortalHeroContent, "key">;

export type PortalHeroEditorSection = {
  key: PortalHeroKey;
  name: string;
  defaults: PortalHeroDefaults;
};

export const ADMIN_HOME_HERO: PortalHeroDefaults = {
  label: "PAINEL ADMINISTRATIVO",
  title: "DJ ON\nAcademy.",
  description:
    "Gerencie alunos, eventos e agendamentos da academia em um só lugar.",
  banner: "/images/djon-showcase.png",
};

export const PROFESSOR_HOME_HERO: PortalHeroDefaults = {
  label: "PROFESSOR",
  title: "{{nome}},\npronto pra\nensinar?",
  description:
    "Conduza suas turmas, acompanhe seus alunos e compartilhe sua experiência com a próxima geração de DJs.",
  banner: "/images/djon-showcase.png",
};

export const STUDENT_HOME_HERO: PortalHeroDefaults = {
  label: "BEM-VINDO DE VOLTA",
  title: "{{nome}},\no que vamos\nfazer hoje?",
  description:
    "Explore seus cursos, acompanhe sua evolução e continue desenvolvendo sua identidade como DJ.",
  banner: "/images/djon-hero.png",
};

export const HOME_HERO_SECTIONS: readonly PortalHeroEditorSection[] = [
  { key: "student-home", name: "Aluno", defaults: STUDENT_HOME_HERO },
  { key: "professor-home", name: "Professor", defaults: PROFESSOR_HOME_HERO },
  { key: "admin-home", name: "Administração", defaults: ADMIN_HOME_HERO },
];

export const STUDENT_COURSES_HERO: PortalHeroDefaults = {
  label: "PORTAL DO ALUNO",
  title: "Cursos",
  description:
    "Acompanhe sua formação e conheça os próximos cursos disponíveis na DJ ON Academy.",
  banner: "/images/djon-hero.png",
};

export const STAFF_COURSES_HERO: PortalHeroDefaults = {
  label: "GESTÃO ACADÊMICA",
  title: "Turmas",
  description:
    "Acompanhe as turmas, os alunos e o andamento dos cursos da DJ ON Academy.",
  banner: "/images/djon-hero.png",
};

export const COURSES_HERO_SECTIONS: readonly PortalHeroEditorSection[] = [
  { key: "student-courses", name: "Aluno", defaults: STUDENT_COURSES_HERO },
  {
    key: "staff-courses",
    name: "Professor / Admin",
    defaults: STAFF_COURSES_HERO,
  },
];

export const MURAL_HERO: PortalHeroDefaults = {
  label: "COMUNIDADE",
  title: "Mural de\nEventos.",
  description:
    "Veja o que está acontecendo na comunidade DJ ON — shows, formaturas e eventos dos seus colegas.",
  banner: "/images/mural-hero.png",
};

export const STUDENT_EVENTS_HERO: PortalHeroDefaults = {
  label: "MEUS EVENTOS",
  title: "Onde Você\nVai Tocar.",
  description:
    "Divulgue seus shows no mural da comunidade e marque sua presença na cena.",
  banner: "/images/mural-hero.png",
};

export const PROFESSOR_EVENTS_HERO: PortalHeroDefaults = {
  label: "MEUS EVENTOS",
  title: "Onde Você\nVai Tocar.",
  description:
    "Divulgue seus shows no mural da comunidade e compartilhe sua agenda com os alunos.",
  banner: "/images/mural-hero.png",
};

export const ADMIN_EVENTS_HERO: PortalHeroDefaults = {
  label: "ADMINISTRAÇÃO",
  title: "Gerenciar\nEventos.",
  description:
    "Publique eventos oficiais e acompanhe as divulgações da comunidade DJ ON.",
  banner: "/images/mural-hero.png",
};

export const EVENTS_HERO_SECTIONS: readonly PortalHeroEditorSection[] = [
  { key: "mural", name: "Mural", defaults: MURAL_HERO },
  { key: "student-events", name: "Aluno", defaults: STUDENT_EVENTS_HERO },
  {
    key: "professor-events",
    name: "Professor",
    defaults: PROFESSOR_EVENTS_HERO,
  },
  {
    key: "admin-events",
    name: "Administração",
    defaults: ADMIN_EVENTS_HERO,
  },
];

export const STUDENT_BOOKINGS_HERO: PortalHeroDefaults = {
  label: "PORTAL DO ALUNO",
  title: "Agendamentos",
  description:
    "Solicite seus treinos nos horários disponíveis. Aulas são agendadas diretamente pelos professores ou pela administração.",
  banner: "/images/djon-hero.png",
};
