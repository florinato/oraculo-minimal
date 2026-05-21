"use client"
import { getI18n } from "@/app/lib/i18n";
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Home() {
  const [selectedFormat, setSelectedFormat] = useState<string>("")
  const [question, setQuestion] = useState("")
  const router = useRouter()
  
  const { t, currentLang } = getI18n();

  const formats = [
    { id: "pi_simple_5", name: "La Encrucijada del Umbral", desc: "5 cartas que revelan tu estado mental, raíces, pasado, presente y futuro." },
    { id: "pi_rapida_3", name: "Línea Temporal", desc: "3 cartas en línea: Pasado, Presente, Futuro. Perfecto para consultas rápidas." },
    { id: "pi_sino_1", name: "El Oráculo Directo", desc: "1 sola carta que responde directamente a tu pregunta. Máxima claridad." }
  ]

  const handleStart = () => {
    if (question.trim().length > 5 && selectedFormat) {
      router.push(`/lectura?q=${encodeURIComponent(question)}&lang=${currentLang}&format=${selectedFormat}`)
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col justify-end items-center bg-black text-white font-sans overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/vidente_desk.jpg" className="w-full h-full object-cover opacity-90" alt="Vidente" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-lg p-4 pb-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-500 uppercase tracking-widest">
            {t.home.title}
          </h1>
        </div>

        {/* SELECTOR DE TIRADA - DROPDOWN */}
        <div className="space-y-2">
          <label className="block text-amber-400 text-sm font-semibold uppercase tracking-wide">
            {t.home.select_format}
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full p-3 bg-black/80 border border-amber-900/50 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500 transition-all text-base cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23D97706' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px'
            }}
          >
            <option value="">Selecciona una tirada...</option>
            {formats.map((format) => (
              <option key={format.id} value={format.id}>
                {format.name}
              </option>
            ))}
          </select>
          {selectedFormat && (
            <p className="text-amber-200/70 text-xs italic">
              {formats.find(f => f.id === selectedFormat)?.desc}
            </p>
          )}
        </div>

        {/* TEXTAREA CON PREGUNTA */}
        {selectedFormat && (
          <div className="relative animate-in fade-in duration-300">
            <textarea
              className="w-full h-32 p-5 bg-black/80 border border-amber-900/50 rounded-3xl text-amber-100 placeholder:text-amber-800/60 focus:outline-none focus:border-amber-500 transition-all text-lg shadow-2xl backdrop-blur-md resize-none"
              placeholder={t.home.placeholder}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
        )}

        {/* BOTÓN CONSULTAR */}
        {selectedFormat && (
          <button
            onClick={handleStart}
            disabled={question.trim().length <= 5}
            className="w-full py-4 bg-amber-800 hover:bg-amber-700 disabled:opacity-30 text-white font-bold rounded-2xl text-lg border-b-4 border-amber-950 active:border-b-0 transition-all animate-in fade-in duration-300"
          >
            {t.home.button}
          </button>
        )}

        <div className="flex justify-between px-3 text-[9px] text-white/30 uppercase tracking-[0.3em]">
          <span>{t.home.footer_left}</span>
          <span>{t.home.footer_right}</span>
        </div>
      </div>
    </main>
  )
}
