"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

const pageTitles: Array<[RegExp, string]> = [
  [/^\/$/, "Seu sonho começa aqui | DJ ON"],
  [/^\/brand\/?$/, "Brand System x Salin | DJ ON"],
  [/^\/login\/?$/, "Acessar Portal | DJ ON"],
  [/^\/dashboard\/student\/?$/, "Área do Aluno | DJ ON"],
  [/^\/dashboard\/student\/agendar\/?$/, "Agenda | DJ ON"],
  [/^\/dashboard\/student\/evento\/?$/, "Meus Eventos | DJ ON"],
  [/^\/dashboard\/student\/perfil\/?$/, "Meu Perfil | DJ ON"],
  [/^\/dashboard\/student\/professores\/?$/, "Professores | DJ ON"],
  [/^\/dashboard\/professor\/?$/, "Área do Professor | DJ ON"],
  [/^\/dashboard\/professor\/evento\/?$/, "Meus Eventos | DJ ON"],
  [/^\/dashboard\/professor\/alunos\/?$/, "Meus Alunos | DJ ON"],
  [/^\/dashboard\/professor\/professores\/?$/, "Professores | DJ ON"],
  [/^\/dashboard\/admin\/?$/, "Administração | DJ ON"],
  [/^\/dashboard\/admin\/alunos\/?$/, "Gerenciar Alunos | DJ ON"],
  [/^\/dashboard\/admin\/professores\/?$/, "Gerenciar Professores | DJ ON"],
  [/^\/dashboard\/admin\/eventos\/?$/, "Gerenciar Eventos | DJ ON"],
  [/^\/dashboard\/admin\/equipamentos\/?$/, "Gerenciar Equipamentos | DJ ON"],
  [/^\/dashboard\/admin\/unidades\/?$/, "Gerenciar Unidades | DJ ON"],
  [/^\/dashboard\/admin\/leads\/?$/, "Contatos e Leads | DJ ON"],
  [/^\/dashboard\/admin\/config\/?$/, "Configurações | DJ ON"],
  [/^\/dashboard\/agenda\/?$/, "Agenda | DJ ON"],
  [/^\/dashboard\/cursos\/?$/, "Cursos | DJ ON"],
  [/^\/dashboard\/turmas\/?$/, "Turmas | DJ ON"],
  [/^\/dashboard\/material\/cursos\/[^/]+\/?$/, "Aulas do curso | DJ ON"],
  [/^\/dashboard\/material\/?$/, "Materiais | DJ ON"],
  [/^\/dashboard\/material\/novo\/?$/, "Novo Material | DJ ON"],
  [/^\/dashboard\/material\/[^/]+\/?$/, "Material | DJ ON"],
  [/^\/dashboard\/mural\/?$/, "Mural de Eventos | DJ ON"],
  [/^\/dashboard\/notificacoes\/?$/, "Notificações | DJ ON"],
  [/^\/dashboard\/perfil\/[^/]+\/?$/, "Perfil | DJ ON"],
]

function getTitle(pathname: string) {
  return pageTitles.find(([pattern]) => pattern.test(pathname))?.[1] ?? "Portal DJ ON | DJ ON"
}

const PAGE_TITLE_CONTEXT_EVENT = "djon:page-title-context"

type PageTitleContext = {
  pathname: string
  title: string
}

function withBrand(title: string) {
  return title.endsWith("| DJ ON") ? title : `${title} | DJ ON`
}

export function usePageTitle(title?: string | null) {
  const pathname = usePathname()

  useEffect(() => {
    const normalizedTitle = title?.trim()
    if (!normalizedTitle) return
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent<PageTitleContext>(PAGE_TITLE_CONTEXT_EVENT, {
        detail: { pathname, title: normalizedTitle },
      }))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, title])
}

export function PageTitleManager() {
  const pathname = usePathname()
  const [context, setContext] = useState<PageTitleContext | null>(null)

  useEffect(() => {
    const updateContext = (event: Event) => {
      setContext((event as CustomEvent<PageTitleContext>).detail)
    }
    window.addEventListener(PAGE_TITLE_CONTEXT_EVENT, updateContext)
    return () => window.removeEventListener(PAGE_TITLE_CONTEXT_EVENT, updateContext)
  }, [])

  useEffect(() => {
    const title = context?.pathname === pathname
      ? withBrand(context.title)
      : getTitle(pathname)

    const restoreTitle = () => {
      const titleElements = Array.from(document.head.querySelectorAll("title"))
      if (titleElements.length === 0) {
        const titleElement = document.createElement("title")
        titleElement.textContent = title
        document.head.appendChild(titleElement)
        return
      }

      titleElements.forEach((titleElement) => {
        if (titleElement.textContent !== title) {
          titleElement.textContent = title
        }
      })
    }

    restoreTitle()
    const observer = new MutationObserver(restoreTitle)
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })
    window.addEventListener("pageshow", restoreTitle)
    document.addEventListener("visibilitychange", restoreTitle)

    return () => {
      observer.disconnect()
      window.removeEventListener("pageshow", restoreTitle)
      document.removeEventListener("visibilitychange", restoreTitle)
    }
  }, [context, pathname])

  return null
}
