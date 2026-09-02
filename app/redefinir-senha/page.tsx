"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { KeyRound } from "lucide-react"
import { store } from "@/lib/store"

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [localError, setLocalError] = useState("")

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password !== confirmation) {
      setLocalError("As senhas precisam ser iguais.")
      return
    }
    setLocalError("")
    setLoading(true)
    try {
      await store.resetPassword(token, password)
      setDone(true)
    } catch {
      // O cliente HTTP apresenta o erro padronizado.
    } finally {
      setLoading(false)
    }
  }

  if (!token) return <p className="text-sm leading-relaxed text-djon-warning-red">Este link está incompleto. Solicite uma nova recuperação de senha.</p>
  if (done) return <div className="space-y-5"><p className="rounded-xl border border-djon-success/20 bg-djon-success/8 p-4 text-sm text-djon-text/75">Sua senha foi redefinida. Você já pode entrar no portal.</p><Link href="/login" className="block rounded-xl bg-djon-accent py-3.5 text-center text-sm font-black text-djon-ink">IR PARA O LOGIN</Link></div>

  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="mb-2 block text-xs font-bold tracking-wide text-djon-text/50">NOVA SENHA</label><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-4 py-3 text-sm text-djon-text focus:border-djon-accent/50 focus:outline-none" /></div>
      <div><label className="mb-2 block text-xs font-bold tracking-wide text-djon-text/50">CONFIRMAR NOVA SENHA</label><input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-4 py-3 text-sm text-djon-text focus:border-djon-accent/50 focus:outline-none" /></div>
      {localError && <p className="text-xs text-djon-warning-red">{localError}</p>}
      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-djon-accent py-3.5 text-sm font-black text-djon-ink disabled:opacity-60"><KeyRound size={16} />{loading ? "SALVANDO..." : "REDEFINIR SENHA"}</button>
    </form>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-svh flex items-center justify-center px-4 py-6 sm:py-10 relative overflow-hidden noise-overlay bg-djon-page">
      <div className="absolute inset-0"><Image src="/images/djon-hero.png" alt="" fill className="object-cover opacity-25" priority /><div className="absolute inset-0 bg-djon-black/75" /></div>
      <motion.div className="relative z-10 w-full max-w-md" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex justify-center sm:mb-10"><Image src="/images/djon-verde.png" alt="DJ ON Academy" width={221} height={56} className="h-11 w-auto sm:h-14" style={{ width: "auto" }} priority /></div>
        <div className="rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6 sm:p-8"><p className="mb-2 text-xs font-bold tracking-wide text-djon-accent">SEGURANÇA</p><h1 className="mb-2 text-3xl font-black tracking-tighter text-djon-text">Crie uma nova senha</h1><p className="mb-8 text-sm leading-relaxed text-djon-text/45">Use pelo menos 8 caracteres e escolha uma senha que só você conhece.</p><Suspense fallback={<p className="text-sm text-djon-text/50">Carregando...</p>}><ResetPasswordForm /></Suspense></div>
      </motion.div>
    </div>
  )
}
