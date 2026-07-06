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
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    setTimeout(() => {
      const user = store.loginWithEmail(email.trim())
      if (!user) {
        setError("E-mail não autorizado. Fale com um administrador da DJ ON para liberar seu acesso.")
        setLoading(false)
        return
      }
      const dest =
        user.role === "admin"
          ? "/dashboard/admin"
          : user.role === "professor"
          ? "/dashboard/professor"
          : "/dashboard/student"
      router.push(dest)
    }, 800)
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-[safe_center] px-4 py-8 sm:py-10 relative overflow-x-hidden overflow-y-auto noise-overlay bg-[#0a0a0a]">
      {/* Hero background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/djon-hero.png"
          alt=""
          fill
          className="object-cover opacity-25"
          priority
        />
        {/* Heavy dark overlay so content is readable */}
        <div className="absolute inset-0 bg-[#0a0a0a]/75" />
      </div>

      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold tracking-wide transition-colors z-10"
      >
        <ArrowLeft size={14} />
        VOLTAR
      </Link>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <Image
            src="/images/djon-verde.png"
            alt="DJ ON Academy"
            width={160}
            height={52}
            className="h-14 w-auto"
            priority
          />
        </div>

        {/* Card */}
        <div className="bg-[#161616] border border-white/10 rounded-2xl p-8">
          <p className="text-[#AFFF00] text-xs tracking-wide font-bold mb-2">ÁREA DO ALUNO</p>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-1">Acessar Portal</h1>
          <div className="h-[3px] w-10 bg-[#AFFF00] rounded-full mb-6" />
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Entre com o e-mail cadastrado pelo administrador da DJ ON Academy para acessar o portal.
          </p>

          {/* Google mock button */}
          <motion.button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white text-[#121212] rounded-xl py-3.5 font-bold text-sm mb-6"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              // Mock: use first allowed email for demo
              const emails = store.getAllowedEmails()
              if (emails.length > 0) {
                setEmail(emails[1]) // default to first student
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuar com Google
          </motion.button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">ou entre com e-mail</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-white/50 text-xs font-bold tracking-wide mb-2 block">E-MAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#AFFF00]/50 focus:bg-white/8 transition-all"
              />
            </div>

            {error && (
              <motion.p
                className="text-red-400 text-xs leading-relaxed"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-[#AFFF00] text-[#121212] rounded-xl py-3.5 font-black text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? (
                <motion.div
                  className="w-4 h-4 border-2 border-[#121212] border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <>
                  <LogIn size={15} />
                  ENTRAR
                </>
              )}
            </motion.button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/30 text-xs mb-2 font-bold tracking-wide">DEMO — E-MAILS DE TESTE:</p>
            <div className="space-y-1">
              {store.getAllowedEmails().map((em) => {
                const u = store.getUsers().find((u) => u.email === em)
                return (
                    <button
                    key={em}
                    type="button"
                    onClick={() => setEmail(em)}
                    className="cursor-pointer block w-full text-left text-white/40 hover:text-[#AFFF00] text-xs font-mono transition-colors py-0.5"
                  >
                    {em} <span className="text-white/20">({u?.role})</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
