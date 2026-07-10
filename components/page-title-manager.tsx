"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const pageTitles: Array<[RegExp, string]> = [
  [/^\/$/, "Seu sonho começa aqui | DJ ON"],
  [/^\/brand\/?$/, "Brand System x Salin | DJ ON"],
  [/^\/login\/?$/, "Acessar Portal | DJ ON"],
  [/^\/dashboard\/student\/?$/, "Portal do aluno | DJ ON"],
  [/^\/dashboard\/student\/agendar\/?$/, "Solicitar treino | DJ ON"],
  [/^\/dashboard\/student\/evento\/?$/, "Meus eventos | DJ ON"],
  [/^\/dashboard\/student\/perfil\/?$/, "Meu perfil | DJ ON"],
  [/^\/dashboard\/student\/professores\/?$/, "Professores | DJ ON"],
  [/^\/dashboard\/professor\/?$/, "Portal do professor | DJ ON"],
  [/^\/dashboard\/professor\/alunos\/?$/, "Alunos | DJ ON"],
  [/^\/dashboard\/professor\/professores\/?$/, "Professores | DJ ON"],
  [/^\/dashboard\/admin\/?$/, "Administração | DJ ON"],
  [/^\/dashboard\/admin\/alunos\/?$/, "Gerenciar alunos | DJ ON"],
  [/^\/dashboard\/admin\/professores\/?$/, "Gerenciar professores | DJ ON"],
  [/^\/dashboard\/admin\/eventos\/?$/, "Gerenciar eventos | DJ ON"],
  [/^\/dashboard\/admin\/agendar\/?$/, "Novo agendamento | DJ ON"],
  [/^\/dashboard\/admin\/config\/?$/, "Configurações | DJ ON"],
  [/^\/dashboard\/agenda\/?$/, "Agenda da escola | DJ ON"],
  [/^\/dashboard\/material\/?$/, "Material de aula | DJ ON"],
  [/^\/dashboard\/material\/novo\/?$/, "Novo material | DJ ON"],
  [/^\/dashboard\/material\/[^/]+\/?$/, "Material aberto | DJ ON"],
  [/^\/dashboard\/mural\/?$/, "Mural de GIGs | DJ ON"],
  [/^\/dashboard\/perfil\/[^/]+\/?$/, "Perfil da comunidade | DJ ON"],
]

function getTitle(pathname: string) {
  return pageTitles.find(([pattern]) => pattern.test(pathname))?.[1] ?? "DJ ON Academy | Música, palco e performance"
}

export function PageTitleManager() {
  const pathname = usePathname()

  useEffect(() => {
    const title = getTitle(pathname)
    document.title = title

    const restoreTitle = () => {
      document.title = title
    }

    window.addEventListener("pageshow", restoreTitle)
    document.addEventListener("visibilitychange", restoreTitle)

    return () => {
      window.removeEventListener("pageshow", restoreTitle)
      document.removeEventListener("visibilitychange", restoreTitle)
    }
  }, [pathname])

  return null
}
