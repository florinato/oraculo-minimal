"use client"
import { getI18n, LANGUAGE_CONFIG } from "@/app/lib/i18n";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [lang, setLang] = useState<string>("es");

  useEffect(() => {
    const { currentLang } = getI18n();
    setLang(currentLang);
  }, []);

  const { t } = getI18n(lang);

  return (
    <main className="relative min-h-screen flex flex-col items-center bg-black text-white font-sans overflow-hidden">
      
      {/* FONDO */}
      <div className="absolute inset-0 z-0">
        <img src="/portada_PI_ARC.png" className="w-full h-full object-cover" alt="Portada" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* SELECTOR IDIOMAS */}
      <div className="absolute top-4 right-4 z-50 animate-in fade-in">
        <div className="relative bg-black/60 border border-[#E5C158]/60 rounded-full px-2 py-1 backdrop-blur-md shadow-lg flex items-center">
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="appearance-none bg-transparent text-[#E5C158] font-bold text-sm outline-none cursor-pointer pl-2 pr-6"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23E5C158' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 4px center'
            }}
          >
            {Object.values(LANGUAGE_CONFIG).map((l) => (
              <option key={l.code} value={l.code} className="bg-black text-[#E5C158]">
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 w-full px-4 h-screen flex flex-col items-center">
        
        {/* ESPACIO SUPERIOR (MÁS GRANDE) */}
        <div className="h-2/3 w-full" />
        
        {/* TÍTULO COMENZANDO DESDE LA MITAD HACIA ABAJO */}
        <div className="text-center space-y-2">
          <h1 className="text-6xl md:text-7xl font-bold text-[#E5C158] uppercase tracking-widest drop-shadow-lg">
            PI ARCANA
          </h1>
          <p className="text-[#E5C158] text-3xl md:text-4xl font-bold uppercase tracking-widest drop-shadow-lg">
            TAROT
          </p>
          <button
            onClick={() => router.push('/selector')}
            className="mt-8 px-12 py-5 bg-[#E5C158]/20 hover:bg-[#E5C158]/30 active:bg-[#E5C158]/40 text-[#E5C158] font-bold rounded-xl text-xl border-2 border-[#E5C158] active:border-[#E5C158] active:translate-y-1 transition-all shadow-2xl uppercase tracking-widest drop-shadow-lg"
          >
            {t.home.enter || "Entrar"}
          </button>
        </div>
      </div>
    </main>
  )
}
