"use client"
import { drawFiveCards, getCardImageUrl } from "@/app/lib/tarot-api";
import CardDetail from "@/components/CardDetail";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getI18n } from "../lib/i18n";

function ReadingContent() {
  const searchParams = useSearchParams();
  const question = searchParams.get("q") || "";
  const [text, setText] = useState("");
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const hasStarted = useRef(false);
  
  const langParam = searchParams.get("lang");
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

        if (!response.ok) throw new Error("Fallo");

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
            if (line.trim().startsWith('data: ')) {
              try {
                const data = JSON.parse(line.replace('data: ', '').trim());
                if (data.text) setText(prev => prev + data.text);
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        setText(t.reading.error);
      } finally {
        setLoading(false);
      }
    };
    startInference();
  }, [question, t.reading.error, currentLang]);

  if (cards.length === 0) return <div className="min-h-screen bg-black" />;

  return (
    <div className="relative min-h-screen w-full bg-black text-amber-50 overflow-y-auto overflow-x-hidden">
      
      {/* CAPA FIJA: Imagen y Cartas sincronizadas por el alto */}
      <div className="fixed inset-0 h-screen w-full flex justify-center items-center z-10 pointer-events-none">
        <div className="relative h-screen aspect-square flex justify-center items-center">
            
            {/* Imagen siempre ajustada al alto de la pantalla */}
            <img 
              src="/mesa_lectura.jpg" 
              className="h-full w-auto object-contain pointer-events-none" 
              alt="Mesa" 
            />
            
            {/* El "Área de la Mesa": Usamos vh para que las cartas escalen con la imagen */}
            <div className="absolute inset-0 flex justify-center items-center" style={{ perspective: '120vh' }}>
                <div 
                  className="grid grid-cols-3 grid-rows-3" 
                  style={{ 
                    transform: 'rotateX(45deg) translateY(10vh)', // Inclinación y posición relativa al alto
                    transformStyle: 'preserve-3d',
                    gap: '2vh' // Espacio entre cartas relativo al alto
                  }}
                >
                  <div className="col-start-2 row-start-1"><CardImg card={cards[2]} label={t.reading.labels.mente} onClick={() => setSelectedCard(cards[2])} /></div>
                  <div className="col-start-1 row-start-2"><CardImg card={cards[0]} label={t.reading.labels.pasado} onClick={() => setSelectedCard(cards[0])} /></div>
                  <div className="col-start-2 row-start-2"><CardImg card={cards[4]} label={t.reading.labels.presente} onClick={() => setSelectedCard(cards[4])} /></div>
                  <div className="col-start-3 row-start-2"><CardImg card={cards[1]} label={t.reading.labels.futuro} onClick={() => setSelectedCard(cards[1])} /></div>
                  <div className="col-start-2 row-start-3"><CardImg card={cards[3]} label={t.reading.labels.raices} onClick={() => setSelectedCard(cards[3])} /></div>
                </div>
            </div>
        </div>
      </div>

      {/* CAPA DE SCROLL: Solo el texto */}
      <div className="relative z-20 w-full flex flex-col items-center pointer-events-none">
        <div className="h-[85vh] w-full" />
        <div className="w-full max-w-2xl bg-black/85 backdrop-blur-md p-8 rounded-t-[40px] border-t border-amber-900/40 shadow-[0_-20px_50px_rgba(0,0,0,0.9)] min-h-[60vh] pointer-events-auto">
          <div className="prose prose-invert prose-amber max-w-none font-serif text-lg leading-relaxed">
            <ReactMarkdown components={{ strong: ({...props}) => <span className="text-amber-500 font-bold" {...props} /> }}>
              {text}
            </ReactMarkdown>
            {loading && <div className="mt-4 animate-pulse text-amber-700 italic">{t.reading.loading}</div>}
          </div>
          
          {!loading && text.length > 50 && (
            <div className="mt-10 pb-10 flex justify-center">
                <button onClick={() => window.location.href='/'} className="px-8 py-3 bg-amber-900/40 border border-amber-600/50 text-amber-500 rounded-full italic font-serif">
                  {t.reading.new_reading}
                </button>
            </div>
          )}
        </div>
      </div>

      <CardDetail 
        card={selectedCard} 
        onClose={() => setSelectedCard(null)} 
        info={selectedCard ? t.cards[selectedCard.imageId]?.info : ""} 
      />

    </div>
  );
}

// CardImg: Ahora su tamaño depende de VH para ser siempre proporcional a la mesa
function CardImg({ card, label, onClick }: { card: any, label: string, onClick: () => void }) {
  return (
    <div className="flex flex-col items-center cursor-pointer group pointer-events-auto" onClick={onClick}>
      <span className="text-[1vh] text-amber-700 uppercase tracking-widest mb-1 font-bold bg-black/40 px-1 rounded-sm">
        {label}
      </span>
      {/* El tamaño es 18vh de alto, así siempre ocupa el mismo espacio físico sobre la foto */}
      <div className="h-[18vh] aspect-[2/3.2] shadow-2xl rounded-sm overflow-hidden border border-white/10 bg-amber-900/10 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
        <img src={getCardImageUrl(card?.name)} className="w-full h-full object-cover" alt="Carta" />
      </div>
    </div>
  )
}

export default function ReadingPage() {
  return <Suspense><ReadingContent /></Suspense>;
}