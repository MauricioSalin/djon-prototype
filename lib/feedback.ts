"use client"

import { toast } from "sonner"

type ErrorWithStatus = Error & { status?: number }

const validationMessages: Array<[RegExp, string]> = [
  [/email must be an email/i, "Informe um e-mail válido."],
  [/password must be longer than or equal to (\d+) characters/i, "A senha deve ter pelo menos $1 caracteres."],
  [/must be longer than or equal to (\d+) characters/i, "Este campo deve ter pelo menos $1 caracteres."],
  [/must be shorter than or equal to (\d+) characters/i, "Este campo deve ter no máximo $1 caracteres."],
  [/should not be empty/i, "Preencha todos os campos obrigatórios."],
  [/must be a valid mongodb id/i, "O item selecionado não é válido."],
]

function translateValidationMessage(message: string) {
  let result = message
  for (const [pattern, replacement] of validationMessages) {
    result = result.replace(pattern, replacement)
  }
  return result
}

export function friendlyErrorMessage(error: unknown) {
  const status = typeof error === "object" && error && "status" in error
    ? Number((error as ErrorWithStatus).status)
    : 0
  const rawMessage = error instanceof Error ? error.message.trim() : ""

  if (status === 0 || rawMessage === "Failed to fetch" || /networkerror|load failed/i.test(rawMessage)) {
    return "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente."
  }
  if (status === 401 && /token de acesso|expirad/i.test(rawMessage)) {
    return "Sua sessão expirou. Entre novamente para continuar."
  }
  if (status === 401 || /unauthorized/i.test(rawMessage)) {
    return "E-mail ou senha inválidos. Confira os dados e tente novamente."
  }
  if (status === 403 && /conta.*desativad/i.test(rawMessage)) {
    return "Sua conta está desativada. Entre em contato com a administração para recuperar o acesso."
  }
  if (status === 403 || /forbidden resource/i.test(rawMessage)) {
    return "Você não tem permissão para realizar esta ação."
  }
  if (status === 404 && (!rawMessage || /not found/i.test(rawMessage))) {
    return "Não encontramos o item solicitado. Atualize a página e tente novamente."
  }
  if (status === 413) return "O arquivo é maior que o limite permitido. Escolha um arquivo menor."
  if (status === 429) return "Foram feitas muitas tentativas. Aguarde um momento e tente novamente."
  if (status >= 500) return "O servidor encontrou um problema. Tente novamente em instantes."
  if (!rawMessage) return "Não foi possível concluir esta ação. Tente novamente."

  return translateValidationMessage(rawMessage)
}

export function notifyRequestError(error: unknown) {
  const description = friendlyErrorMessage(error)
  const status = typeof error === "object" && error && "status" in error
    ? Number((error as ErrorWithStatus).status)
    : 0

  const title = status === 401 && /sessão expirou/i.test(description)
    ? "Sessão expirada"
    : status === 403 && /conta.*desativad/i.test(description)
      ? "Acesso desativado"
      : "Não foi possível concluir"

  toast.error(title, {
    id: `request-error-${status}-${description}`,
    description,
  })
}

export function notifySuccess(title: string, description?: string) {
  toast.success(title, { description })
}

export function notifyError(title: string, description?: string) {
  toast.error(title, { description })
}

const undoDuration = 8000

type UndoableFeedbackOptions = {
  title: string
  description?: string
  undo: () => void | Promise<void>
  commit?: () => void | Promise<void>
  undoTitle?: string
  undoDescription?: string
}

export function notifyUndoable({
  title,
  description,
  undo,
  commit,
  undoTitle = "Ação desfeita",
  undoDescription = "O item foi restaurado.",
}: UndoableFeedbackOptions) {
  let pending = true
  let timer: number | undefined
  let handlePageHide: (() => void) | undefined

  const cleanup = () => {
    if (timer !== undefined) window.clearTimeout(timer)
    if (handlePageHide) window.removeEventListener("pagehide", handlePageHide)
  }

  const handleUndo = async () => {
    if (!pending) return
    pending = false
    cleanup()

    try {
      await undo()
      toast.success(undoTitle, { description: undoDescription })
    } catch (error) {
      notifyRequestError(error)
    }
  }

  toast.success(title, {
    description,
    duration: undoDuration,
    action: {
      label: "Desfazer",
      onClick: () => { void handleUndo() },
    },
  })

  if (commit) {
    const handleCommit = () => {
      if (!pending) return
      pending = false
      cleanup()
      void Promise.resolve(commit()).catch(async (error) => {
        try {
          await undo()
        } finally {
          notifyRequestError(error)
        }
      })
    }
    handlePageHide = handleCommit
    window.addEventListener("pagehide", handlePageHide, { once: true })
    timer = window.setTimeout(handleCommit, undoDuration)
  }
}
