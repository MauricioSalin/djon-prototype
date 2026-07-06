import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { CalendarDays, ChevronDown, Mail, Sparkles } from "lucide-react"
import { SplineScene } from "@/components/spline-scene"

export const metadata: Metadata = {
  title: "Brand DJ ON Academy x Salin",
  description:
    "Apresentação visual da identidade DJ ON Academy: logo, tipografia, paleta, componentes, modelos 3D e proposta criativa assinada por Salin.",
  alternates: {
    canonical: "/brand",
  },
  openGraph: {
    title: "Brand DJ ON Academy x Salin",
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
    title: "Brand DJ ON Academy x Salin",
    description:
      "Identidade visual, componentes, 3D e direção criativa para apresentar a proposta DJ ON Academy.",
    images: ["/images/salin/salin-cenna-4.jpg"],
  },
}

const colors = [
  { name: "Acid Green", hex: "var(--djon-color-accent)", usage: "CTA, foco, highlights e estados ativos" },
  { name: "Black Stage", hex: "var(--djon-color-ink)", usage: "Base escura, headers e fundos principais" },
  { name: "Panel Dark", hex: "var(--djon-color-surface-3)", usage: "Cards, modais, inputs e superfícies" },
  { name: "Line Gray", hex: "var(--djon-color-line)", usage: "Bordas, divisórias e contornos sutis" },
  { name: "Soft Gray", hex: "var(--djon-color-soft-gray)", usage: "Texto secundário e metadados" },
  { name: "Electric Cyan", hex: "var(--djon-color-cyan)", usage: "Acento de variação para professores e dados" },
  { name: "Warm Signal", hex: "var(--djon-color-orange)", usage: "Acento de energia para eventos e alertas" },
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

const components = [
  { label: "Badge", value: "EVENTO OFICIAL" },
  { label: "Tab ativa", value: "TÉCNICA" },
  { label: "Status", value: "PENDENTE" },
]

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-djon-page text-djon-text">
      <section className="relative min-h-screen overflow-hidden">
        <Image src="/images/djon-hero.png" alt="" fill className="object-cover opacity-35" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-djon-ink via-djon-ink/90 to-djon-ink/35" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-djon-page to-transparent" />

        <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 text-xs font-black tracking-[0.35em] text-djon-accent">BRAND SYSTEM</p>
            <h1 className="djon-display-title max-w-5xl font-black text-djon-text">
              A FRONTEIRA ENTRE O SONHO E A{" "}
              <span className="text-djon-accent" style={{ WebkitTextStroke: "1.5px var(--djon-color-ink)", paintOrder: "stroke fill" }}>
                REALIZAÇÃO
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-djon-text/58 md:text-lg">
              Uma identidade de palco: escura, direta, intensa e tecnológica. A marca combina peso visual, energia neon e interfaces de alta leitura para transformar aprendizado em performance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#logo" className="w-full rounded-full bg-djon-accent px-7 py-3 text-center text-sm font-black tracking-widest text-djon-ink sm:w-auto">
                VER SISTEMA
              </a>
              <a href="#ui" className="w-full rounded-full border-2 border-djon-text/25 px-7 py-3 text-center text-sm font-black tracking-widest text-djon-text transition-colors hover:border-djon-accent hover:text-djon-accent sm:w-auto">
                COMPONENTES
              </a>
            </div>
          </div>

          <div className="relative hidden min-h-[430px] lg:block">
            <SplineScene
              scene="https://prod.spline.design/OduYuH7Y3CXDo9Ga/scene.splinecode"
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
        <div className="absolute inset-0 bg-gradient-to-r from-djon-ink via-djon-ink/78 to-djon-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-djon-page via-transparent to-djon-ink/40" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 py-14 sm:px-6 sm:py-16">
          <div className="max-w-3xl">
            <Image
              src="/images/salin/salin-logo-djon-text.png"
              alt="Salin"
              width={360}
              height={110}
              className="mb-9 h-auto w-full max-w-[260px] md:max-w-[360px]"
            />
            <p className="mb-5 text-xs font-black tracking-[0.35em] text-djon-accent">ARTISTA · TECNOLOGIA · IA</p>
            <h2 className="djon-display-title font-black text-djon-text">
              ENTRE O CÓDIGO E A PISTA.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-djon-text/62 md:text-lg">
              Além de DJ e aluno da DJ ON Academy, sou programador em projetos de inteligência artificial e tecnologia financeira, com atuação também em soluções para a Visa. Trabalho com design, produto digital e estou me especializando cada vez mais em IA para conectar criatividade, performance e tecnologia.
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
          <SectionTitle eyebrow="Identidade" title="Logo" description="A assinatura DJ ON deve aparecer com impacto imediato. O símbolo play comunica ação, música e presença digital." />

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-djon-text/10 bg-djon-surface-7 p-10">
              <Image src="/images/djon-verde.png" alt="DJ ON Academy em verde" width={340} height={110} className="h-auto w-full max-w-[340px]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex min-h-[132px] items-center justify-center rounded-2xl border border-djon-text/10 bg-djon-text p-8">
                <Image src="/images/djon-logo.png" alt="DJ ON Academy versão escura" width={220} height={72} className="h-auto w-full max-w-[220px]" />
              </div>
              <div className="rounded-2xl border border-djon-text/10 bg-djon-surface-7 p-6">
                <p className="text-xs font-black tracking-[0.25em] text-djon-accent">USO</p>
                <p className="mt-4 text-sm leading-relaxed text-djon-text/55">
                  Priorizar fundos escuros, áreas limpas e boa margem lateral. Em composições de hero, a marca deve aparecer como sinal forte no primeiro viewport.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="font" className="bg-djon-text py-20 text-djon-ink">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Tipografia" title="Font System" description="Peso alto, tracking apertado no display e textos curtos. O tom é confiante, direto e sem ornamento desnecessário." light />

          <div className="mt-10 grid gap-4">
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
          <SectionTitle eyebrow="Paleta" title="Cores" description="A base é preta e grafite, com verde ácido como energia principal. Ciano e laranja entram apenas como variações de informação." />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {colors.map((color) => (
              <div key={color.hex} className="overflow-hidden rounded-2xl border border-djon-text/10 bg-djon-surface-7">
                <div className="h-32" style={{ backgroundColor: color.hex }} />
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
            <div className="rounded-2xl border border-djon-text/10 bg-djon-surface-8 p-6">
              <p className="mb-5 flex items-center gap-2 text-xs font-black tracking-[0.25em] text-djon-text/45"><Sparkles size={14} /> BOTÕES</p>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-djon-accent px-6 py-3 text-xs font-black tracking-widest text-djon-ink">AGENDAR</button>
                <button className="rounded-full border border-djon-text/20 px-6 py-3 text-xs font-black tracking-widest text-djon-text/70">LOGIN</button>
                <button className="rounded-full bg-djon-text/10 px-6 py-3 text-xs font-black tracking-widest text-djon-text">SALVAR</button>
              </div>
            </div>

            <div className="rounded-2xl border border-djon-text/10 bg-djon-surface-8 p-6">
              <p className="mb-5 flex items-center gap-2 text-xs font-black tracking-[0.25em] text-djon-text/45"><Mail size={14} /> INPUTS</p>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-black tracking-widest text-djon-text/40">E-MAIL</span>
                  <input className="w-full rounded-xl border border-djon-text/12 bg-djon-input px-4 py-3 text-sm text-djon-text outline-none placeholder:text-djon-text/25 focus:border-djon-accent" placeholder="aluno@djonacademy.com" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-black tracking-widest text-djon-text/40">UNIDADE</span>
                  <div className="flex items-center justify-between rounded-xl border border-djon-text/12 bg-djon-input px-4 py-3 text-sm font-bold text-djon-text">
                    Porto Alegre / RS <ChevronDown size={15} className="text-djon-text/45" />
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-djon-text/10 bg-djon-surface-8 p-6">
              <p className="mb-5 flex items-center gap-2 text-xs font-black tracking-[0.25em] text-djon-text/45"><CalendarDays size={14} /> BADGES</p>
              <div className="flex flex-wrap gap-2">
                {components.map((component) => (
                  <span
                    key={component.label}
                    className={`rounded-full px-4 py-2 text-djon-meta font-black tracking-widest ${component.label === "Tab ativa" ? "bg-djon-accent text-djon-ink" : "border border-djon-text/12 bg-djon-text/5 text-djon-text/62"
                      }`}
                  >
                    {component.value}
                  </span>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-djon-text/10 bg-djon-surface-9 p-4">
                <p className="text-sm font-black text-djon-text">Treino Jungle Clássico</p>
                <p className="mt-1 text-xs text-djon-text/38">20/07/2026 às 09:00</p>
                <p className="mt-4 text-xs leading-relaxed text-djon-text/45">Cards devem ser escaneáveis, com contraste alto e ações bem definidas.</p>
              </div>
            </div>
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
              style={{ width: "100%", height: "min(640px, 82svh)" }}
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
