"use client"
import { getI18n } from "@/app/lib/i18n";
import { drawFiveCards, getCardImageUrl } from "@/app/lib/tarot-api";
import CardDetail from "@/components/CardDetail";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

// 1. Tipado para evitar errores de Vercel
interface TarotCard {
  position: number;
  name: string;
  imageId: string;
  is_reversed: boolean;
}

function ReadingContent() {
  const searchParams = useSearchParams();
  const question = searchParams.get("q") || "";
  const langParam = searchParams.get("lang");
  
  const [text, setText] = useState("");
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const hasStarted = useRef(false);

  const { t, currentLang } = getI18n(langParam);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const selectedCards = drawFiveCards();
    setCards(selectedCards);
    
    const startInference = async () => {
      try {
        const response = await fetch('/api/chat', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personality_prompt: "morvan",
            format_id: "simple_5",
            user_question: question,
            cards: selectedCards,
            language: currentLang
          })
        });

        if (!response.ok) throw new Error("API Error");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(cleanLine.slice(6));
                if (data.text) setText(prev => prev + data.text);
              } catch { }
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        setText(t.reading.error + " " + msg);
      } finally {
        setLoading(false);
      }
    };
    startInference();
  }, [question, t.reading.error, currentLang]);

  if (cards.length === 0) return <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 italic">Invocando el umbral...</div>;

  return (
    <div className="relative min-h-screen w-full bg-black text-amber-50 overflow-y-auto overflow-x-hidden scroll-smooth">
      
      {/* CAPA 1: FONDO FIJO (La foto de la mesa) */}
      <div className="fixed inset-0 h-screen w-full flex justify-center items-center z-0 pointer-events-none">
        <img src="/mesa_lectura.jpg" className="h-full w-auto object-contain" alt="Mesa" />
      </div>

      {/* CAPA 2: LAS CARTAS (Lienzo 3D independiente) */}
      {/* Al ser fixed inset-0 y no tener overflow, las cartas tienen espacio infinito para inclinarse */}
      <div className="fixed inset-0 h-screen w-full flex justify-center items-center z-10 pointer-events-none" style={{ perspective: '120vh' }}>
          <div 
            className="grid grid-cols-3 grid-rows-3 pointer-events-auto" 
            style={{ 
              transform: 'rotateX(45deg) translateY(12vh)', 
              transformStyle: 'preserve-3d',
              gap: '2.5vh' 
            }}
          >
            <div className="col-start-2 row-start-1"><CardImg card={cards[2]} label={t.reading.labels.mente} onClick={() => setSelectedCard(cards[2])} /></div>
            <div className="col-start-1 row-start-2"><CardImg card={cards[0]} label={t.reading.labels.pasado} onClick={() => setSelectedCard(cards[0])} /></div>
            <div className="col-start-2 row-start-2"><CardImg card={cards[4]} label={t.reading.labels.presente} onClick={() => setSelectedCard(cards[4])} /></div>
            <div className="col-start-3 row-start-2"><CardImg card={cards[1]} label={t.reading.labels.futuro} onClick={() => setSelectedCard(cards[1])} /></div>
            <div className="col-start-2 row-start-3"><CardImg card={cards[3]} label={t.reading.labels.raices} onClick={() => setSelectedCard(cards[3])} /></div>
          </div>
      </div>

      {/* CAPA 3: SCROLL DE TEXTO (Encima de todo) */}
      <div className="relative z-20 w-full flex flex-col items-center pointer-events-none">
        {/* Espaciador para que el texto empiece abajo */}
        <div className="h-[88vh] w-full" />

        <div className="w-full max-w-2xl bg-black/90 p-8 rounded-t-[40px] border-t border-amber-900/40 shadow-[0_-20px_50px_rgba(0,0,0,1)] min-h-[60vh] pointer-events-auto">
          <div className="prose prose-invert prose-amber max-w-none font-serif text-lg leading-relaxed mb-12">
            <ReactMarkdown components={{ strong: ({...props}) => <span className="text-amber-500 font-bold" {...props} /> }}>
              {text}
            </ReactMarkdown>
            {loading && <div className="mt-4 animate-pulse text-amber-700 italic">{t.reading.loading}</div>}
          </div>
          
          {!loading && text.length > 50 && (
            <div className="pb-10 flex justify-center">
                <button onClick={() => window.location.href='/'} className="px-10 py-4 bg-amber-900/40 border border-amber-600/50 text-amber-500 rounded-full italic font-serif hover:bg-amber-800/40 transition-all active:scale-95 shadow-xl">
                  {t.reading.new_reading}
                </button>
            </div>
          )}
        </div>
      </div>

      {/* CAPA 4: MODAL DE DETALLE */}
      <CardDetail 
        card={selectedCard} 
        onClose={() => setSelectedCard(null)} 
        info={selectedCard ? t.cards[selectedCard.imageId as keyof typeof t.cards]?.info : ""}
      />

    </div>
  );
}

/**
 * Componente Auxiliar CardImg 
 * (Se define fuera para que el código sea más limpio)
 */
interface CardImgProps {
  card: TarotCard;
  label: string;
  onClick: () => void;
}

function CardImg({ card, label, onClick }: CardImgProps) {
  return (
    <div 
      className="flex flex-col items-center cursor-pointer group pointer-events-auto" 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className="text-[1vh] text-amber-700 uppercase tracking-widest mb-1 font-bold bg-black/50 px-2 rounded-sm backdrop-blur-sm">
        {label}
      </span>
      {/* Mantenemos el tamaño, pero quitamos el overflow-hidden si fuera necesario */}
      <div className="h-[12vh] aspect-[2/3.2] shadow-2xl rounded-sm border border-white/10 bg-amber-900/10 transition-all duration-300 group-hover:scale-110 group-active:scale-95">
        <img 
          src={getCardImageUrl(card.imageId)} 
          className="w-full h-full object-contain" // <--- CAMBIO CLAVE: contain en lugar de cover
          alt={card.name} 
        />
      </div>
    </div>
  );
}

export default function ReadingPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <ReadingContent />
    </Suspense>
  );
}
