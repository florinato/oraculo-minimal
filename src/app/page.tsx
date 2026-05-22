"use client"
import { getI18n, LANGUAGE_CONFIG } from "@/app/lib/i18n";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter()
  const [selectedFormat, setSelectedFormat] = useState<string>("")
  const [question, setQuestion] = useState("")
  const [lang, setLang] = useState<string>("es") 

  useEffect(() => {
    const { currentLang } = getI18n();
    setLang(currentLang);
  }, []);

  const { t } = getI18n(lang);

  // Extraemos los formatos directamente del JSON traducido
  const formatOptions = [
    { id: "pi_simple_5", ...t.formats.pi_simple_5 },
    { id: "pi_rapida_3", ...t.formats.pi_rapida_3 },
    { id: "pi_sino_1", ...t.formats.pi_sino_1 }
  ];

  const handleStart = () => {
    if (question.trim().length > 5 && selectedFormat) {
      router.push(`/lectura?q=${encodeURIComponent(question)}&lang=${lang}&format=${selectedFormat}`)
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col justify-end items-center bg-black text-white font-sans overflow-hidden">
      
      {/* FONDO */}
      <div className="absolute inset-0 z-0">
        <img src="/portada.jpg" className="w-full h-full object-cover opacity-90" alt="Vidente" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* SELECTOR IDIOMAS */}
      <div className="absolute top-4 right-4 z-50 animate-in fade-in">
        <div className="relative bg-black/60 border border-amber-900/50 rounded-full px-2 py-1 backdrop-blur-md shadow-lg flex items-center">
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="appearance-none bg-transparent text-amber-500 font-bold text-sm outline-none cursor-pointer pl-2 pr-6"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23D97706' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 4px center'
            }}
          >
            {Object.values(LANGUAGE_CONFIG).map((l) => (
              <option key={l.code} value={l.code} className="bg-black text-white">
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TÍTULO ARRIBA */}
      <div className="absolute top-12 left-0 right-0 z-10 text-center">
        <h1 className="text-3xl font-bold text-amber-500 uppercase tracking-widest drop-shadow-md">
          {t.home.title}
        </h1>
      </div>

      {/* CONTROLES ABAJO */}
      <div className="relative z-10 w-full max-w-lg p-4 pb-8 space-y-6">
        <div className="space-y-2">
          <label className="block text-amber-500/80 text-xs font-bold uppercase tracking-widest">
            {t.home.select_format}
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full p-3 bg-black/80 border border-amber-900/50 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500 transition-all text-sm cursor-pointer appearance-none shadow-xl"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23D97706' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            <option value="" className="text-gray-500">{t.home.select_default}</option>
            {formatOptions.map((format) => (
              <option key={format.id} value={format.id} className="bg-black">
                {format.name}
              </option>
            ))}
          </select>
          {selectedFormat && (
            <p className="text-amber-200/70 text-xs italic px-1">
              {formatOptions.find(f => f.id === selectedFormat)?.description}
            </p>
          )}
        </div>

        {selectedFormat && (
          <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-300">
            <textarea
              className="w-full h-28 p-4 bg-black/80 border border-amber-900/50 rounded-2xl text-amber-100 placeholder:text-amber-800/60 focus:outline-none focus:border-amber-500 transition-all text-base shadow-2xl backdrop-blur-md resize-none"
              placeholder={t.home.placeholder}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
        )}

        {selectedFormat && (
          <button
            onClick={handleStart}
            disabled={question.trim().length <= 5}
            className="w-full py-4 bg-amber-800 hover:bg-amber-700 disabled:opacity-20 text-white font-bold rounded-xl text-lg border-b-4 border-amber-950 active:border-b-0 active:translate-y-1 transition-all animate-in fade-in duration-300 shadow-xl"
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
