import type { Metadata } from "next"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Bell, CalendarDays, Check, ChevronDown, Clock, Download, Edit3, LogIn, Mail, Search, Smartphone, Sparkles, Trash2, User, X } from "lucide-react"
import { SplineScene } from "@/components/spline-scene"
import brandStyles from "./brand.module.css"

export const metadata: Metadata = {
  title: "Brand System x Salin",
  description:
    "Apresentação visual da identidade DJ ON Academy: logo, tipografia, paleta, componentes, modelos 3D e proposta criativa assinada por Salin.",
  alternates: {
    canonical: "/brand",
  },
  openGraph: {
    title: "Brand System x Salin | DJ ON",
    description:
      "Um guia de marca com identidade visual, componentes, 3D e direção criativa para apresentar a proposta DJ ON Academy.",
    url: "/brand",
    images: [
      {
        url: "/images/salin/salin-cenna-4.jpg",
        width: 1200,
        height: 630,
        alt: "DJ ON Academy x Salin - Brand presentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand System x Salin | DJ ON",
    description:
      "Identidade visual, componentes, 3D e direção criativa para apresentar a proposta DJ ON Academy.",
    images: ["/images/salin/salin-cenna-4.jpg"],
  },
}

const colors = [
  { name: "DJ ON Green", hex: "#8AF23B", token: "var(--djon-color-green)", usage: "CTA, foco, highlights e estados ativos" },
  { name: "White Noise", hex: "#FFFFFF", token: "var(--djon-color-white)", usage: "Títulos, logo em negativo e superfícies claras de contraste" },
  { name: "Black", hex: "#000000", token: "var(--djon-color-black)", usage: "Base única para overlays, variando somente a opacidade" },
  { name: "Black Stage", hex: "#121212", token: "var(--djon-color-black-stage)", usage: "Base escura, headers e fundos principais" },
  { name: "Panel Dark", hex: "#1A1A1A", token: "var(--djon-color-panel-dark)", usage: "Cards, modais, inputs e superfícies" },
  { name: "Line Gray", hex: "#2A2A2A", token: "var(--djon-color-line-gray)", usage: "Bordas, divisórias e contornos sutis" },
  { name: "Soft Gray", hex: "#8A8A8A", token: "var(--djon-color-soft-gray)", usage: "Texto secundário e metadados" },
  { name: "Light Purple", hex: "#C5B7F2", token: "var(--djon-color-light-purple)", usage: "Acento de variação e estados antes exibidos em azul, ciano ou amarelo" },
  { name: "Warning Red", hex: "#F87171", token: "var(--djon-color-warning-red)", usage: "Recusas, alertas e ações destrutivas no lugar dos vermelhos e do Warm Signal" },
  { name: "Success", hex: "#34D399", token: "var(--djon-color-success)", usage: "Estados concluídos e confirmações; mantido onde já é usado" },
]

const titleSamples = [
  {
    label: "Hero",
    text: "A FRONTEIRA ENTRE O SONHO E A REALIZAÇÃO",
    className: "djon-display-title",
  },
  {
    label: "Section",
    text: "Nosso Time",
    className: "djon-section-title",
  },
  {
    label: "Card",
    text: "Formação DJ",
    className: "text-xl md:text-2xl leading-tight tracking-tight",
  },
]

const fontExamples = [
  {
    label: "Display / Black",
    text: "SEU SONHO COMEÇA AQUI",
    className: "text-5xl font-black leading-[0.9] tracking-tight md:text-7xl",
  },
  {
    label: "Heading / Black",
    text: "Próximos Shows",
    className: "text-3xl font-black leading-none tracking-tight md:text-5xl",
  },
  {
    label: "Body / Regular",
    text: "A DJ ON usa textos curtos, diretos e com bastante contraste para deixar o usuário sempre orientado.",
    className: "max-w-2xl text-base leading-relaxed text-djon-ink/62",
  },
  {
    label: "Label / Uppercase",
    text: "PORTAL DO ALUNO",
    className: "text-xs font-black tracking-[0.3em] text-djon-ink/45",
  },
  {
    label: "Token / Mono",
    text: "--djon-font-sans: Raleway, system-ui, sans-serif;",
    className: "font-mono text-sm text-djon-ink/58",
  },
]

const fontWeights = [
  { label: "Thin", value: "100", className: "font-thin" },
  { label: "ExtraLight", value: "200", className: "font-extralight" },
  { label: "Light", value: "300", className: "font-light" },
  { label: "Regular", value: "400", className: "font-normal" },
  { label: "Medium", value: "500", className: "font-medium" },
  { label: "Semibold", value: "600", className: "font-semibold" },
  { label: "Bold", value: "700", className: "font-bold" },
  { label: "ExtraBold", value: "800", className: "font-extrabold" },
  { label: "Black", value: "900", className: "font-black" },
]

const components = [
  { label: "Badge", value: "EVENTO OFICIAL" },
  { label: "Tab ativa", value: "TÉCNICA" },
  { label: "Status", value: "PENDENTE" },
  { label: "Info", value: "45 CONFIRMADOS" },
  { label: "Warning", value: "29 PENDENTES" },
  { label: "Pill", value: "PORTO ALEGRE / RS" },
]

const mobileHighlights = [
  {
    icon: Smartphone,
    title: "Mobile first",
    text: "Tudo precisa caber no bolso: agenda, materiais, professores, eventos e solicitações com leitura rápida.",
  },
  {
    icon: Download,
    title: "Instalável",
    text: "A PWA pode ir para a tela inicial e abrir como app, sem passar por loja e sem perder a identidade visual.",
  },
  {
    icon: Bell,
    title: "Notificações",
    text: "Base pronta para avisos nativos de treino aprovado, lembrete de aula, material novo e eventos da comunidade.",
  },
]

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-djon-page text-djon-text">
      <section className="relative min-h-screen overflow-hidden">
        <Image src="/images/djon-hero.png" alt="" fill className="object-cover opacity-35" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-djon-black via-djon-black/90 to-djon-black/35" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-djon-page to-transparent" />

        <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 text-xs font-black tracking-[0.35em] text-djon-accent">BRAND SYSTEM</p>
            <h1 className="djon-display-title max-w-5xl font-black text-djon-text">
              <span className="block">A FRONTEIRA</span>
              <span className="block">ENTRE O SONHO</span>
              <span className="block">
                E A{" "}
                <span className="text-djon-accent" style={{ WebkitTextStroke: "1.5px var(--djon-color-ink)", paintOrder: "stroke fill" }}>
                  REALIZAÇÃO
                </span>
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-djon-text/58 md:text-lg">
              Uma identidade de palco: escura, direta, intensa e tecnológica. A marca combina peso visual, energia neon e interfaces de alta leitura para transformar aprendizado em performance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#logo" className="w-full rounded-full bg-djon-accent px-7 py-3 text-center text-sm font-black tracking-widest text-djon-ink sm:w-auto">
                VER SISTEMA
              </a>
              <a href="#ui" className="w-full rounded-full border-2 border-djon-text/25 px-7 py-3 text-center text-sm font-black tracking-widest text-djon-text transition-colors hover:brightness-110 sm:w-auto">
                COMPONENTES
              </a>
            </div>
          </div>

          <div className="relative hidden min-h-[430px] lg:block">
            <SplineScene
              scene="https://prod.spline.design/OduYuH7Y3CXDo9Ga/scene.splinecode"
              globalEvents
              style={{ width: "100%", height: "430px" }}
              lazyThreshold={0.01}
            />
          </div>
        </div>
      </section>

      <section className="relative min-h-screen overflow-hidden bg-djon-ink">
        <Image
          src="/images/salin/salin-cenna-4.jpg"
          alt="Salin tocando como DJ"
          fill
          className="object-cover object-[55%_center]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-djon-black via-djon-black/78 to-djon-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-djon-black via-transparent to-djon-black/40" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 py-14 sm:px-6 sm:py-16">
          <div className="max-w-3xl">
            <Image
              src="/images/salin/salin-logo-white.png"
              alt="Salin"
              width={360}
              height={110}
              className="mb-9 h-auto w-full max-w-[170px] md:max-w-[240px]"
            />
            <p className="mb-5 text-xs font-black tracking-[0.35em] text-djon-accent">ARTISTA · TECNOLOGIA · IA</p>
            <h2 className="djon-display-title font-black text-djon-text [hyphens:none] [overflow-wrap:normal]">
              ENTRE O <span className="whitespace-nowrap">CÓDIGO</span> E A PISTA.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-djon-text/62 md:text-lg">
              Tenho 29 anos e trabalho há 11 anos como programador. Além de DJ e aluno da DJ ON Academy, faço parte de duas empresas de Inteligência Artificial, e também atuo na Visa, operadora de cartão de crédito. Além disso, trabalho com design, produto digital e estou me especializando cada vez mais em IA para conectar criatividade, performance e tecnologia.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["DJ", "Aluno DJ ON", "Programador", "Design", "Inteligência Artificial"].map((item) => (
                <span key={item} className="rounded-full border border-djon-text/15 bg-djon-text/8 px-4 py-2 text-djon-meta font-black tracking-widest text-djon-text/70 backdrop-blur-sm">
                  {item.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="logo" className="bg-djon-page py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Identidade" title="Logo" description="A proposta mantém a essência da logo original porque ela já tem uma identidade forte: impacto imediato, peso visual e reconhecimento rápido. O símbolo play continua comunicando ação, música e presença digital, preservando o que a marca já tem de mais potente e levando essa assinatura para um sistema mais consistente." />

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-djon-text/10 bg-djon-surface-7 p-10 lg:col-span-2">
              <Image src="/images/djon-verde.png" alt="DJ ON Academy em verde" width={340} height={110} className="h-auto w-full max-w-[340px]" />
            </div>
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-djon-text/10 bg-djon-surface-8 p-8">
              <Image src="/images/djon-logo.png" alt="DJ ON Academy versão compacta" width={220} height={72} className="h-auto w-full max-w-[220px] drop-shadow-djon-soft" />
            </div>
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-djon-ink/10 bg-djon-text p-8">
              <Image src="/images/djon-logo-preta-j-grosso.svg" alt="DJ ON Academy versão preta" width={300} height={78} className="h-auto w-full max-w-[300px]" />
            </div>
            <div className="rounded-2xl border border-djon-text/10 bg-djon-surface-7 p-6 sm:p-8 lg:col-span-2">
              <p className="text-xs font-black tracking-[0.25em] text-djon-accent">USO</p>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-djon-text/55">
                Priorizar fundos escuros, áreas limpas e boa margem lateral. Em composições de hero, a marca deve aparecer como sinal forte no primeiro viewport.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="font" className="bg-djon-text py-20 text-djon-ink">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Tipografia" title="Font System DJ ON" description="A hierarquia global combina Bowlby One SC para máximo impacto, Raleway para interface e leitura, e Big Noodle Titling para títulos condensados. A terceira função usa uma substituta visual aberta até a entrega do webfont licenciado." light />

          <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex h-full flex-col rounded-2xl border border-djon-ink/10 bg-djon-light-surface p-6 md:p-8">
              <div>
                <p className="text-xs font-black tracking-[0.25em] text-djon-ink/45">FONTE PRINCIPAL</p>
                <h3 className={`${brandStyles.raleway} mt-4 text-5xl font-black leading-none tracking-tight md:text-7xl`}>Raleway</h3>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-djon-ink/58">
                  A família completa de 100 a 900, com estilos normal e itálico, substitui a Inter em toda a interface.
                </p>
              </div>
              <div className="mt-7 flex-1 rounded-2xl border border-djon-ink/10 bg-djon-text p-5">
                <p className="text-xs font-black tracking-[0.25em] text-djon-ink/38">TIPOS</p>
                <div className="mt-4 grid gap-2">
                  {fontWeights.map((weight) => (
                    <div key={weight.value} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl bg-djon-ink/[0.035] px-4 py-3 text-djon-ink">
                      <span className={`text-lg leading-none ${weight.className}`}>Raleway {weight.label}</span>
                      <span className="font-mono text-xs text-djon-ink/38">{weight.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-djon-ink/10 bg-djon-light-surface p-5 md:p-6">
                <p className="mb-3 text-xs font-black tracking-[0.25em] text-djon-ink/38">DISPLAY / BOWLBY ONE SC</p>
                <p className={`${brandStyles.bowlby} text-4xl leading-tight md:text-6xl`}>SEU SONHO COMEÇA AQUI</p>
              </div>
              <div className="rounded-2xl border border-djon-ink/10 bg-djon-light-surface p-5 md:p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black tracking-[0.25em] text-djon-ink/38">TITLING / BIG NOODLE TITLING</p>
                  <span className="rounded-full bg-djon-light-purple/25 px-3 py-1 text-[10px] font-black tracking-wider text-djon-ink/65">WEBFONT LICENCIADO PENDENTE</span>
                </div>
                <p className={`${brandStyles.bigNoodle} text-5xl font-black uppercase leading-none tracking-wide md:text-7xl`}>A fronteira entre o sonho e a realização</p>
                <p className="mt-3 text-xs leading-relaxed text-djon-ink/50">Prévia com Barlow Condensed, substituta aberta de proporção semelhante.</p>
              </div>
              {fontExamples.map((sample) => (
                <div key={sample.label} className="rounded-2xl border border-djon-ink/10 bg-djon-light-surface p-5 md:p-6">
                  <p className="mb-3 text-xs font-black tracking-[0.25em] text-djon-ink/38">{sample.label.toUpperCase()}</p>
                  <p className={sample.className}>{sample.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            {titleSamples.map((sample) => (
              <div key={sample.label} className="rounded-2xl border border-djon-ink/10 bg-djon-light-surface p-6 md:p-8">
                <p className="mb-4 text-xs font-black tracking-[0.25em] text-djon-ink/45">{sample.label.toUpperCase()}</p>
                <p className={`${sample.className} font-black`}>
                  {sample.text.includes("REALIZAÇÃO") ? (
                    <>
                      A FRONTEIRA ENTRE O SONHO E A <span className="text-djon-accent" style={{ WebkitTextStroke: "1.2px var(--djon-color-ink)", paintOrder: "stroke fill" }}>REALIZAÇÃO</span>
                    </>
                  ) : (
                    sample.text
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cores" className="bg-djon-page py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Paleta" title="Cores" description="Esta paleta está centralizada em todo o projeto: lilás substitui azul, ciano e amarelo; Warning Red substitui os demais vermelhos e o antigo Warm Signal." />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {colors.map((color) => (
              <div key={color.hex} className="overflow-hidden rounded-2xl border border-djon-text/10 bg-djon-surface-7">
                <div className="h-32 border-b border-djon-text/10" style={{ backgroundColor: color.token }} />
                <div className="p-5">
                  <p className="font-black tracking-tight text-djon-text">{color.name}</p>
                  <p className="mt-1 font-mono text-xs text-djon-text/40">{color.hex}</p>
                  <p className="mt-4 text-xs leading-relaxed text-djon-text/45">{color.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ui" className="bg-djon-ink py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Interface" title="Componentes" description="Elementos arredondados, escuros, densos e com estados claros. O verde deve guiar ação, não decorar tudo." />

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <ComponentCard icon={<Sparkles size={14} />} title="BOTÕES">
              <div className="grid gap-3">
                <PortalButton full icon={<CalendarDays size={15} />}>AGENDAR</PortalButton>
                <PortalButton full variant="dark" icon={<LogIn size={15} />}>ENTRAR</PortalButton>
                <PortalButton full variant="outline">VER CURSOS</PortalButton>
                <div className="grid grid-cols-[1fr_auto_auto] gap-3">
                  <PortalButton variant="ghost">SALVAR</PortalButton>
                  <PortalIconButton label="Editar"><Edit3 size={16} /></PortalIconButton>
                  <PortalIconButton label="Excluir" variant="danger"><Trash2 size={16} /></PortalIconButton>
                </div>
                <p className="text-xs leading-relaxed text-djon-text/38">
                  Hover padrão do portal: escala leve, toque com compressão e sem trocar a cor base do botão.
                </p>
              </div>
            </ComponentCard>

            <ComponentCard icon={<Mail size={14} />} title="CAMPOS">
              <div className="space-y-3">
                <PortalField label="E-MAIL" placeholder="aluno@djonacademy.com" />
                <PortalSelect label="UNIDADE" value="Porto Alegre / RS" />
                <label className="block">
                  <span className="mb-2 block text-xs font-black tracking-widest text-djon-text/40">BUSCA</span>
                  <div className="flex items-center gap-3 rounded-xl border border-djon-text/12 bg-djon-input px-4 py-3 text-sm text-djon-text/45 transition-colors focus-within:border-djon-accent/50">
                    <Search size={15} />
                    Buscar alunos, materiais, eventos...
                  </div>
                </label>
              </div>
            </ComponentCard>

            <ComponentCard icon={<CalendarDays size={14} />} title="STATUS E CARDS">
              <div className="flex flex-wrap gap-2">
                {components.map((component) => (
                  <PortalBadge key={component.label} label={component.label}>
                    {component.value}
                  </PortalBadge>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-djon-text/10 bg-djon-surface-9 p-4 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-djon-text">Treino Jungle Clássico</p>
                    <p className="mt-1 text-xs font-bold text-djon-text/38">Fernanda Lima</p>
                  </div>
                  <PortalBadge label="Info">CONFIRMADO</PortalBadge>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs font-bold text-djon-text/42">
                  <span className="flex items-center gap-1.5"><CalendarDays size={13} /> 20/07/2026</span>
                  <span className="flex items-center gap-1.5"><Clock size={13} /> 09:00</span>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard icon={<Bell size={14} />} title="NOTIFICAÇÃO">
              <div className="rounded-2xl border border-djon-text/10 bg-djon-surface-9 p-4">
                <div className="flex items-start gap-3">
                  <div className="relative flex size-10 items-center justify-center rounded-full bg-djon-accent text-djon-ink">
                    <Bell size={17} />
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-djon-accent text-[9px] font-black text-djon-ink ring-2 ring-djon-surface-9">6</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-djon-text">Solicitações de treino</p>
                    <p className="mt-1 text-xs leading-relaxed text-djon-text/52">6 aguardando aprovação dos professores.</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <PortalButton icon={<Check size={14} />}>APROVAR</PortalButton>
                  <PortalButton variant="danger" icon={<X size={14} />}>RECUSAR</PortalButton>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard icon={<User size={14} />} title="PERFIL">
              <div className="rounded-2xl border border-djon-text/10 bg-djon-surface-9 p-4">
                <div className="flex items-center gap-3">
                  <div className="djon-avatar-fallback flex size-12 items-center justify-center rounded-full text-sm font-black text-djon-text">C</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-djon-text">Camila Souza</p>
                    <p className="text-[10px] font-black tracking-widest text-djon-accent">PROFESSOR</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 border-t border-djon-text/10 pt-4 text-xs font-bold text-djon-text/45">
                  <span className="flex items-center gap-2"><Mail size={13} /> camila@djonacademy.com</span>
                  <span className="flex items-center gap-2"><User size={13} /> Perfil editável no portal</span>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard icon={<CalendarDays size={14} />} title="MODAL">
              <div className="rounded-2xl border border-djon-text/12 bg-djon-surface-9 p-5">
                <p className="text-xs font-black tracking-[0.25em] text-djon-accent">NOVO</p>
                <h3 className="mt-2 text-2xl font-black text-djon-text">Treino</h3>
                <div className="mt-4 grid gap-3">
                  <PortalField label="TÍTULO" placeholder="Treino de Beat Match" defaultValue="Treino de Beat Match" />
                  <div className="grid grid-cols-2 gap-3">
                    <PortalSelect label="DATA" value="20/07/2026" icon={<CalendarDays size={14} />} />
                    <PortalSelect label="HORÁRIO" value="19:00" icon={<Clock size={14} />} />
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black tracking-widest text-djon-text/38">OBSERVAÇÕES</span>
                    <textarea
                      className="min-h-20 w-full resize-none rounded-xl border border-djon-text/12 bg-djon-input px-4 py-3 text-xs font-bold leading-relaxed text-djon-text outline-none transition-colors placeholder:text-djon-text/25 hover:brightness-110 focus:border-djon-accent/50"
                      placeholder="O que você quer trabalhar nesse treino?"
                      defaultValue="Quero revisar transições e preparar repertório para meu primeiro set."
                    />
                  </label>
                  <PortalButton full> SOLICITAR TREINO </PortalButton>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>
      </section>

      <section id="3d" className="relative overflow-hidden bg-djon-text py-20 text-djon-ink">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black tracking-[0.3em] text-djon-ink/45">3D ASSET</p>
            <h2 className="djon-section-title mt-3 font-black">
              3D Models
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-djon-ink/60">
              O 3D entra como assinatura de tecnologia e movimento. Deve aparecer em áreas amplas, com respiro, carregamento sob demanda e fundo transparente.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-black tracking-widest">
              <span className="rounded-full bg-djon-ink px-4 py-2 text-djon-accent">LAZY LOAD</span>
              <span className="rounded-full border border-djon-ink/15 px-4 py-2 text-djon-ink/65">TRANSPARENTE</span>
              <span className="rounded-full border border-djon-ink/15 px-4 py-2 text-djon-ink/65">CACHE-BUSTER</span>
            </div>
          </div>
          <div className="relative min-h-[460px] sm:min-h-[560px]">
            <SplineScene
              scene="https://prod.spline.design/mZzZrAV9qXxQ452n/scene.splinecode"
              preloadOnIdle
              rotationObject="realistic_headphone"
              style={{ width: "100%", height: "min(640px, 82svh)" }}
            />
          </div>
        </div>
      </section>

      <section id="mobile-pwa" className="relative overflow-hidden bg-djon-ink py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-djon-surface-9 to-djon-ink" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-djon-accent/45 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="djon-reveal-up">
            <SectionTitle
              eyebrow="Mobile & PWA"
              title="Pronto para virar app no celular"
              description="A experiência mobile foi pensada como portal instalável: o aluno acessa a agenda, recebe avisos e volta para o conteúdo sem sentir que está usando uma página improvisada no navegador."
            />

            <div className="mt-8 grid gap-3">
              {mobileHighlights.map((item, index) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.title}
                    className="djon-reveal-up flex gap-4 rounded-2xl border border-djon-text/10 bg-djon-text/5 p-4 transition-colors duration-300 hover:brightness-110"
                    style={{ animationDelay: `${160 + index * 110}ms` }}
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-djon-accent/12 text-djon-accent">
                      <Icon size={19} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-djon-text">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-djon-text/48">{item.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="djon-reveal-up mt-8 rounded-2xl border border-djon-accent/25 bg-djon-accent/8 p-5 transition-transform duration-300 hover:-translate-y-1" style={{ animationDelay: "520ms" }}>
              <p className="text-xs font-black tracking-[0.25em] text-djon-accent">PUSH NATIVO</p>
              <p className="mt-3 text-sm leading-relaxed text-djon-text/58">
                Quando o usuário permitir, a PWA fica preparada para entregar notificações no celular como um app: solicitações de treino, aprovações, remarcações, lembretes e novos materiais.
              </p>
            </div>
          </div>

          <div className="djon-reveal-up relative min-h-[560px] overflow-visible" style={{ animationDelay: "240ms" }}>
            <SplineScene
              scene="https://prod.spline.design/SPNH95ca1bV6ceH1/scene.splinecode"
              style={{ width: "100%", height: "min(680px, 78svh)" }}
              lazyThreshold={0.08}
            />
          </div>
        </div>
      </section>

      <section className="bg-djon-page py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <div>
            <p className="text-xs font-black tracking-[0.3em] text-djon-accent">DJ ON ACADEMY x SALIN</p>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-djon-text md:text-5xl">Será que vamos fazer um ótimo trabalho juntos?</h2>
          </div>
          <Link href="/" className="w-full rounded-full bg-djon-accent px-8 py-3 text-sm font-black tracking-widest text-djon-ink transition-transform hover:scale-[1.03] sm:w-auto">
            VER PROPOSTA
          </Link>
        </div>
      </section>
    </main>
  )
}

function SectionTitle({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string
  title: string
  description: string
  light?: boolean
}) {
  return (
    <div>
      <p className={`text-xs font-black tracking-[0.3em] ${light ? "text-djon-ink/45" : "text-djon-accent"}`}>{eyebrow.toUpperCase()}</p>
      <h2 className={`djon-section-title mt-3 font-black ${light ? "text-djon-ink" : "text-djon-text"}`}>{title}</h2>
      <div className="mt-4 h-1 w-10 rounded-full bg-djon-accent" />
      <p className={`mt-5 max-w-2xl text-sm leading-relaxed ${light ? "text-djon-ink/60" : "text-djon-text/50"}`}>{description}</p>
    </div>
  )
}

function ComponentCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-djon-text/10 bg-djon-surface-8 p-6">
      <p className="mb-5 flex items-center gap-2 text-xs font-black tracking-[0.25em] text-djon-text/45">
        {icon} {title}
      </p>
      {children}
    </div>
  )
}

function PortalButton({
  children,
  icon,
  variant = "primary",
  full = false,
}: {
  children: ReactNode
  icon?: ReactNode
  variant?: "primary" | "dark" | "outline" | "ghost" | "danger"
  full?: boolean
}) {
  const variants = {
    primary: "bg-djon-accent text-djon-ink",
    dark: "bg-djon-text text-djon-ink",
    outline: "border border-djon-text/20 bg-transparent text-djon-text/82",
    ghost: "bg-djon-text/8 text-djon-text",
    danger: "border border-djon-warning-red/30 bg-transparent text-djon-warning-red",
  }

  return (
    <button
      type="button"
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-xs font-black tracking-widest transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60 ${full ? "w-full" : ""} ${variants[variant]}`}
    >
      {icon}
      {children}
    </button>
  )
}

function PortalIconButton({
  children,
  label,
  variant = "default",
}: {
  children: ReactNode
  label: string
  variant?: "default" | "danger"
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex size-12 items-center justify-center rounded-xl border transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97] ${
        variant === "danger"
          ? "border-djon-warning-red/24 bg-transparent text-djon-warning-red"
          : "border-djon-text/12 bg-djon-text/5 text-djon-text/62"
      }`}
    >
      {children}
    </button>
  )
}

function PortalField({
  label,
  placeholder,
  defaultValue,
}: {
  label: string
  placeholder: string
  defaultValue?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black tracking-widest text-djon-text/40">{label}</span>
      <input
        className="h-12 w-full rounded-xl border border-djon-text/12 bg-djon-input px-4 text-sm font-bold text-djon-text outline-none transition-colors placeholder:text-djon-text/25 hover:brightness-110 focus:border-djon-accent/50"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </label>
  )
}

function PortalSelect({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black tracking-widest text-djon-text/40">{label}</span>
      <button
        type="button"
        className="flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-djon-text/12 bg-djon-input px-4 text-left text-sm font-bold text-djon-text transition-colors hover:brightness-110 focus:border-djon-accent/50 focus:outline-none"
      >
        <span className="truncate">{value}</span>
        <span className="shrink-0 text-djon-text/40">{icon ?? <ChevronDown size={15} />}</span>
      </button>
    </label>
  )
}

function PortalBadge({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const variants =
    label === "Tab ativa"
      ? "bg-djon-accent text-djon-ink"
      : label === "Info"
        ? "bg-djon-accent/15 text-djon-accent"
        : label === "Warning"
          ? "bg-djon-light-purple/15 text-djon-light-purple"
          : "border border-djon-text/12 bg-djon-text/5 text-djon-text/62"

  return (
    <span className={`rounded-full px-3.5 py-1.5 text-djon-meta font-black tracking-widest ${variants}`}>
      {children}
    </span>
  )
}
