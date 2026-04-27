"use client"
import { getI18n } from "@/app/lib/i18n"; // Traemos al gestor
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Home() {
  const [question, setQuestion] = useState("")
  const router = useRouter()
  
  // Obtenemos los textos y el código de idioma detectado automáticamente
  const { t, currentLang } = getI18n();

  const handleStart = () => {
    if (question.trim().length > 5) {
      // Pasamos a la lectura la pregunta y el idioma que el gestor decidió
      router.push(`/lectura?q=${encodeURIComponent(question)}&lang=${currentLang}`)
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col justify-end items-center bg-black text-white font-sans overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/vidente_desk.jpg" className="w-full h-full object-cover opacity-90" alt="Vidente" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-lg p-4 pb-8 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-500 uppercase tracking-widest">
            {t.home.title}
          </h1>
        </div>

        <div className="relative">
          <textarea
            className="w-full h-32 p-5 bg-black/80 border border-amber-900/50 rounded-3xl text-amber-100 placeholder:text-amber-800/60 focus:outline-none focus:border-amber-500 transition-all text-lg shadow-2xl backdrop-blur-md resize-none"
            placeholder={t.home.placeholder}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <button
          onClick={handleStart}
          disabled={question.trim().length <= 5}
          className="w-full py-4 bg-amber-800 hover:bg-amber-700 disabled:opacity-10 text-white font-bold rounded-2xl text-lg border-b-4 border-amber-950 active:border-b-0 transition-all"
        >
          {t.home.button}
        </button>

        <div className="flex justify-between px-3 text-[9px] text-white/30 uppercase tracking-[0.3em]">
          <span>{t.home.footer_left}</span>
          <span>{t.home.footer_right}</span>
        </div>
      </div>
    </main>
  )
}