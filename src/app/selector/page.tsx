"use client"
import { getI18n, LANGUAGE_CONFIG } from "@/app/lib/i18n";
import { TarotFormatSelector } from "@/components/TarotFormatSelector";
import { initializePiSdk, createDonation } from "@/app/lib/pi-payments";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Selector() {
  const router = useRouter()
  const [selectedFormat, setSelectedFormat] = useState<string>("pi_simple_5")
  const [question, setQuestion] = useState("")
  const [lang, setLang] = useState<string>("es")
  const [isDonating, setIsDonating] = useState(false)

  useEffect(() => {
    const { currentLang } = getI18n();
    setLang(currentLang);
    // Pre-inicializar el SDK de Pi en background
    initializePiSdk().catch((e) => console.error("[Selector] Error pre-inicializando Pi:", e));
  }, []);

  const { t } = getI18n(lang);

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
    <main className="relative min-h-screen flex flex-col justify-between bg-[#0a0a0a] text-white font-sans overflow-hidden px-4 py-2">
      
      {/* BOTÓN VOLVER */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full border border-[#E5C158]/50 bg-[#100C1A]/80 flex items-center justify-center hover:border-[#E5C158] hover:bg-[#100C1A] transition-all backdrop-blur-md"
        title="Volver a inicio"
      >
        <svg className="w-5 h-5 text-[#E5C158]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      {/* FONDO SIN BLUR */}
      <div className="absolute inset-0 z-0">
        <img src="/portada_PI_ARC.png" className="w-full h-full object-cover opacity-90" alt="Portada" />
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

      {/* TÍTULO ARRIBA (Ajustado para dejar espacio en móvil) */}
      <div className="relative z-10 text-center flex flex-col items-center pt-2">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#E5C158] uppercase tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(229,193,88,0.5)]">
          PI ARCANA
        </h1>
        <p className="text-[#E5C158]/80 text-xl md:text-2xl font-serif font-bold uppercase tracking-[0.3em] mt-1">
          TAROT
        </p>
      </div>

      {/* CONTROLES (Empujados hacia abajo para ocupar el espacio central hasta el pie) */}
      <div className="relative z-10 w-full max-w-lg mx-auto space-y-3 flex-grow flex flex-col justify-end pb-2">
        <TarotFormatSelector
          selectedFormat={selectedFormat}
          onFormatChange={setSelectedFormat}
          formats={formatOptions}
        />

        {/* ENTRADA DE TEXTO ADAPTADA A LA ESTÉTICA */}
        {selectedFormat && (
          <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-xl border-[1.5px] border-[#E5C158]/50 p-1 bg-black/40 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.8)] transition-all">
              <div className="h-full rounded-lg border border-[#E5C158]/30 bg-[#130E24]/80 p-3 flex flex-col items-center justify-center">
                <textarea
                  className="w-full h-18 bg-transparent text-[#E5C158] placeholder:text-[#E5C158]/40 focus:outline-none text-left resize-none font-serif text-sm md:text-base leading-relaxed"
                  placeholder={t.home.placeholder}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {selectedFormat && (
          <button
            onClick={() => {
              console.log("[v0] Button clicked, question:", question, "length:", question.trim().length);
              handleStart();
            }}
            disabled={question.trim().length <= 5}
            className="w-full py-4 bg-gradient-to-b from-[#E5C158] to-[#B38F1B] hover:from-[#f5d576] hover:to-[#c4a12f] disabled:opacity-30 disabled:grayscale text-[#100C1A] font-bold uppercase tracking-widest rounded-xl text-sm border-b-4 border-[#7A600D] active:border-b-0 active:translate-y-1 transition-all animate-in fade-in duration-300 shadow-xl"
          >
            {t.home.button}
          </button>
        )}

        <div className="flex justify-between items-center px-3 pt-1 text-[9px] text-white/30 uppercase tracking-[0.3em]">
          <span>{t.home.footer_left}</span>
          <button
            onClick={async () => {
              setIsDonating(true);
              try {
                await createDonation(0.1, "Donación voluntaria Arcana Tarot Pi 🔮", {
                  onApprovalRequested: () => console.log("[Selector] Aprobación solicitada"),
                  onApprovalSuccess: () => console.log("[Selector] Aprobación exitosa"),
                  onApprovalError: (err) => alert(`Error en aprobación: ${err}`),
                  onCompletionStart: () => console.log("[Selector] Completación iniciada"),
                  onCompletionSuccess: () => alert("¡Muchas gracias por tu donación!"),
                  onCompletionError: (err) => alert(`Error en completación: ${err}`),
                  onCancelled: () => console.log("[Selector] Pago cancelado"),
                  onError: (err) => alert(`Error: ${err}`)
                });
              } catch (error: any) {
                console.error("[Selector] Error en donación:", error);
              } finally {
                setIsDonating(false);
              }
            }}
            disabled={isDonating}
            className="px-3 py-1 text-[8px] bg-[#E5C158]/10 border border-[#E5C158]/50 rounded hover:bg-[#E5C158]/20 disabled:opacity-50 transition-colors text-[#E5C158]/70 hover:text-[#E5C158] font-bold"
          >
            {isDonating ? "Procesando..." : t.home.footer_center}
          </button>
          <span>{t.home.footer_right}</span>
        </div>
      </div>
    </main>
  )
}
