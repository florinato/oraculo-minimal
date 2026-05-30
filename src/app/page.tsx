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
    <main className="relative min-h-screen flex flex-col items-center bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      {/* FONDO */}
      <div className="absolute inset-0 z-0">
        <img src="/portada_PI_ARC.png" className="w-full h-full object-cover" alt="Portada" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* SELECTOR IDIOMAS */}
      <div className="absolute top-4 right-4 z-50 animate-in fade-in">
        <div className="relative bg-[#100C1A]/80 border border-[#E5C158]/50 rounded-full px-2 py-1 backdrop-blur-md shadow-lg flex items-center">
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
              <option key={l.code} value={l.code} className="bg-[#100C1A] text-[#E5C158]">
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
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-7xl font-serif font-bold text-[#E5C158] uppercase tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(229,193,88,0.5)]">
            PI ARCANA
          </h1>
          <p className="text-[#E5C158]/80 text-3xl md:text-4xl font-serif font-bold uppercase tracking-[0.3em]">
            TAROT
          </p>
          <button
            onClick={() => router.push('/selector')}
            className="mt-8 px-12 py-4 text-[#E5C158] font-serif font-bold rounded-xl text-lg uppercase tracking-widest transition-all shadow-2xl
              border-[1.5px] border-[#E5C158] bg-[#130E24]/60 hover:bg-[#130E24]/90 hover:border-[#E5C158] hover:shadow-[0_0_25px_rgba(229,193,88,0.3)]
              active:scale-95 active:shadow-[0_0_10px_rgba(229,193,88,0.2)]"
          >
            {t.home.enter || "Entrar"}
          </button>
        </div>
      </div>
    </main>
  )
}
