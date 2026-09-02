"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowLeft, Mail } from "lucide-react"
import { store } from "@/lib/store"

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      await store.requestPasswordReset(email.trim())
      setSent(true)
    } catch {
      // O cliente HTTP apresenta o erro padronizado.
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-4 py-6 sm:py-10 relative overflow-hidden noise-overlay bg-djon-page">
      <div className="absolute inset-0"><Image src="/images/djon-hero.png" alt="" fill className="object-cover opacity-25" priority /><div className="absolute inset-0 bg-djon-black/75" /></div>
      <motion.div className="relative z-10 w-full max-w-md" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex justify-center sm:mb-10"><Image src="/images/djon-verde.png" alt="DJ ON Academy" width={221} height={56} className="h-11 w-auto sm:h-14" style={{ width: "auto" }} priority /></div>
        <div className="rounded-2xl border border-djon-text/10 bg-djon-surface-2 p-6 sm:p-8">
          <p className="mb-2 text-xs font-bold tracking-wide text-djon-accent">RECUPERAR ACESSO</p>
          <h1 className="mb-2 text-3xl font-black tracking-tighter text-djon-text">Esqueceu sua senha?</h1>
          <p className="mb-8 text-sm leading-relaxed text-djon-text/45">Digite seu e-mail e enviaremos um link seguro para você criar uma nova senha.</p>
          {sent ? (
            <div className="rounded-xl border border-djon-accent/20 bg-djon-accent/8 p-4 text-sm leading-relaxed text-djon-text/70">Se o e-mail estiver cadastrado, o link chegará em instantes. Verifique também a caixa de spam.</div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div><label className="mb-2 block text-xs font-bold tracking-wide text-djon-text/50">E-MAIL</label><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" className="w-full rounded-xl border border-djon-text/10 bg-djon-text/5 px-4 py-3 text-sm text-djon-text placeholder:text-djon-text/20 focus:border-djon-accent/50 focus:outline-none" /></div>
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-djon-accent py-3.5 text-sm font-black tracking-wide text-djon-ink disabled:opacity-60"><Mail size={16} />{loading ? "ENVIANDO..." : "ENVIAR LINK"}</button>
            </form>
          )}
          <Link href="/login" className="mt-7 flex items-center justify-center gap-2 text-xs font-bold text-djon-text/50 transition-opacity hover:opacity-80"><ArrowLeft size={14} /> VOLTAR AO LOGIN</Link>
        </div>
      </motion.div>
    </div>
  )
}
