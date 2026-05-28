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

      {/* CONTENIDO */}
      <div className="relative z-10 w-full px-4 flex flex-col items-center flex-1">
        
        {/* MITAD SUPERIOR VACÍA */}
        <div className="h-1/2 w-full" />
        
        {/* MITAD INFERIOR CON TÍTULO AL PRINCIPIO */}
        <div className="h-1/2 w-full flex flex-col items-center">
          {/* TÍTULO EN LA CABECERA DE LA MITAD INFERIOR */}
          <div className="text-center space-y-2 pt-8">
            <h1 className="text-6xl md:text-7xl font-bold text-amber-500 uppercase tracking-widest drop-shadow-lg">
              PI ARCANA
            </h1>
            <p className="text-amber-500 text-3xl md:text-4xl font-bold uppercase tracking-widest drop-shadow-lg">
              TAROT
            </p>
          </div>

          {/* BOTÓN DE ENTRADA - Al pie con margen */}
          <div className="flex flex-col items-center gap-6 pb-12 flex-1 justify-end w-full">
            <button
              onClick={() => router.push('/selector')}
              className="px-12 py-5 bg-amber-800 hover:bg-amber-700 active:bg-amber-900 text-white font-bold rounded-xl text-xl border-b-4 border-amber-950 active:border-b-0 active:translate-y-1 transition-all shadow-2xl uppercase tracking-widest drop-shadow-lg"
            >
              {t.home.enter || "Entrar"}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
