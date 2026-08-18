"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, LogIn } from "lucide-react"
import { store } from "@/lib/store"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const user = await store.login(email.trim(), password)
      const destination = user.role === "admin"
        ? "/dashboard/admin"
        : user.role === "professor"
          ? "/dashboard/professor"
          : "/dashboard/student"
      router.push(destination)
    } catch {
      // O cliente HTTP já apresenta o erro de forma padronizada.
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = "w-full bg-djon-text/5 border border-djon-text/10 rounded-xl px-4 py-3 text-djon-text text-sm placeholder:text-djon-text/20 focus:outline-none focus:border-djon-accent/50 focus:bg-djon-text/8 transition-all"

  return (
    <div className="min-h-svh flex flex-col items-center justify-[safe_center] px-4 py-8 sm:py-10 relative overflow-x-clip noise-overlay bg-djon-page">
      <div className="absolute inset-0 z-0">
        <Image src="/images/djon-hero.png" alt="" fill className="object-cover opacity-25" priority />
        <div className="absolute inset-0 bg-djon-page/75" />
      </div>

      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-djon-text/50 hover:text-djon-text text-xs font-bold tracking-wide transition-colors z-10">
        <ArrowLeft size={14} />
        VOLTAR
      </Link>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }}
      >
        <div className="flex items-center justify-center mb-10">
          <Image src="/images/djon-verde.png" alt="DJ ON Academy" width={160} height={52} className="h-14 w-auto" priority />
        </div>

        <div className="bg-djon-surface-2 border border-djon-text/10 rounded-2xl p-8">
          <p className="text-djon-accent text-xs tracking-wide font-bold mb-2">ÁREA DO ALUNO</p>
          <h1 className="text-3xl font-black text-djon-text tracking-tighter mb-1">Acessar Portal</h1>
          <div className="h-[3px] w-10 bg-djon-accent rounded-full mb-6" />
          <p className="text-djon-text/40 text-sm leading-relaxed mb-8">
            Entre com seu e-mail e senha cadastrados para acessar o portal.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-djon-text/50 text-xs font-bold tracking-wide mb-2 block">E-MAIL</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" required autoComplete="email" className={fieldClass} />
            </div>
            <div>
              <label className="text-djon-text/50 text-xs font-bold tracking-wide mb-2 block">SENHA</label>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" required minLength={8} autoComplete="current-password" className={fieldClass} />
            </div>

            <motion.button type="submit" disabled={loading} className="w-full bg-djon-accent text-djon-ink rounded-xl py-3.5 font-black text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-60" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              {loading ? (
                <motion.div className="w-4 h-4 border-2 border-djon-ink border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
              ) : (
                <><LogIn size={15} /> ENTRAR</>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
