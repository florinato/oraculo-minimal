"use client"
import { getI18n } from "@/app/lib/i18n";
import { drawFiveCards, getCardImageUrl } from "@/app/lib/tarot-api";
import CardDetail from "@/components/CardDetail";
import NarrativeResponse from "@/components/NarrativeResponse";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 1. Tipado para evitar errores de Vercel
interface TarotCard {
  position: number;
  name: string;
  imageId: string;
  is_reversed: boolean;
  meaning?: string;
}

function ReadingContent() {
  const searchParams = useSearchParams();
  const question = searchParams.get("q") || "";
  const langParam = searchParams.get("lang");
  const formatParam = searchParams.get("format") || "pi_simple_5";

  const [text, setText] = useState("");
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [selectionPhase, setSelectionPhase] = useState(true);
  const [selectedDeckIndices, setSelectedDeckIndices] = useState<Set<number>>(new Set());
  const hasStarted = useRef(false);

  const { t, currentLang, aiInstruction } = getI18n(langParam);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Generar cartas según el formato
    let selectedCards: TarotCard[] = [];
    if (formatParam === "pi_rapida_3") {
      selectedCards = drawFiveCards().slice(0, 3); // Pasado, Presente, Futuro
    } else if (formatParam === "pi_sino_1") {
      selectedCards = drawFiveCards().slice(0, 1); // Solo 1 carta
    } else {
      selectedCards = drawFiveCards(); // 5 cartas (default)
    }
    setCards(selectedCards);

    // Iniciar selección de cartas
    setSelectionPhase(true);
    setRevealedCards(new Set());
    setSelectedDeckIndices(new Set());

    const startInference = async () => {
      try {
        console.log("[v0] Iniciando lectura con:", {
          question,
          currentLang,
          format: formatParam,
          cardsCount: selectedCards.length
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personality_prompt: "aura",
            format_id: formatParam,
            user_question: question,
            cards: selectedCards,
            language: aiInstruction
          })
        });

        console.log("[v0] Respuesta /api/chat:", response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.text();
          console.error("[v0] Error en API:", errorData);
          throw new Error("API Error: " + response.status);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) {
          console.error("[v0] No hay body en respuesta");
          return;
        }

        console.log("[v0] Leyendo stream...");
        let buffer = "";
        let chunkCount = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("[v0] Stream completado. Chunks:", chunkCount);
            break;
          }

          chunkCount++;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(cleanLine.slice(6));
                if (data.text) {
                  console.log("[v0] Chunk recibido:", data.text.substring(0, 50));
                  setText(prev => prev + data.text);
                }
              } catch {
                console.log("[v0] Error parseando JSON:", cleanLine.substring(0, 100));
              }
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[v0] Error en startInference:", msg);
        setText(t.reading.error + " " + msg);
      } finally {
        setLoading(false);
      }
    };
    startInference();
  }, [question, t.reading.error, currentLang, formatParam, aiInstruction]);

  // Auto-reveal cartas en secuencia cuando termina la fase de selección
  useEffect(() => {
    if (!selectionPhase && cards.length > 0 && revealedCards.size === 0) {
      // Iniciar revelación automática de cartas en secuencia (2 seg de retraso inicial, 0.5 seg entre cada una)
      const timers: NodeJS.Timeout[] = [];

      for (let i = 0; i < cards.length; i++) {
        const timer = setTimeout(() => {
          setRevealedCards(prev => {
            const newRevealed = new Set(prev);
            newRevealed.add(i);
            return newRevealed;
          });
        }, 2000 + (i * 500)); // 2 seg de retraso inicial + 0.5 seg entre cada carta
        timers.push(timer);
      }

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [selectionPhase, cards.length]);

  if (cards.length === 0) return <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 italic">Invocando el umbral...</div>;

  return (
    <div className="relative min-h-screen w-full bg-black text-amber-50 overflow-y-auto overflow-x-hidden scroll-smooth">

      {/* BOTÓN VOLVER */}
      <button
        onClick={() => window.history.back()}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full border border-[#E5C158]/50 bg-[#100C1A]/80 flex items-center justify-center hover:border-[#E5C158] hover:bg-[#100C1A] transition-all backdrop-blur-md"
        title="Volver atrás"
      >
        <svg className="w-5 h-5 text-[#E5C158]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* CAPA 1: FONDO FIJO (La foto de portada con blur suave) */}
      <div className="fixed inset-0 h-screen w-full overflow-hidden z-0 pointer-events-none flex justify-center items-center">
        <img src="/portada_PI_ARC.png" className="w-full h-full object-cover blur-sm" alt="Portada" />
      </div>

      {/* CAPA 2: MAZO EXTENDIDO (Selección de cartas) */}
      {selectionPhase && (
        <ExpandedDeck
          selectedIndices={selectedDeckIndices}
          cardsToSelect={cards.length}
          onCardClick={(index) => {
            const newSelected = new Set(selectedDeckIndices);
            newSelected.add(index);
            setSelectedDeckIndices(newSelected);

            // Cuando se seleccionan todas, pasamos a la mesa
            if (newSelected.size === cards.length) {
              setSelectionPhase(false);
            }
          }}
        />
      )}

      {/* CAPA 3: LAS CARTAS (Lienzo 3D independiente) */}
      {/* Grid siempre visible: placeholders durante selección, cartas reales después */}
      <div className="fixed inset-0 h-screen w-full flex justify-center items-start z-10 pointer-events-none pt-12" style={{ perspective: '120vh' }}>
        <>
          {cards.length === 1 ? (
              <div className="grid grid-cols-1 place-items-center pointer-events-auto">
                <div className="transition-all duration-500 opacity-100 scale-100">
                  <CardImgFaceDown
                    card={cards[0]}
                    index={0}
                    isRevealed={revealedCards.has(0)}
                    canReveal={true}
                    onReveal={() => {
                      const newRevealed = new Set(revealedCards);
                      newRevealed.add(0);
                      setRevealedCards(newRevealed);
                    }}
                    onReviewCard={() => setSelectedCard(cards[0])}
                  />
                </div>
              </div>
            ) : cards.length === 3 ? (
              <div className="grid grid-cols-3 pointer-events-auto" style={{ gap: '3vh' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="transition-all duration-500">
                    {selectionPhase ? (
                      <CardPlaceholder index={i} />
                    ) : (
                      <CardImgFaceDown
                        card={cards[i]}
                        index={i}
                        isRevealed={revealedCards.has(i)}
                        canReveal={true}
                        onReveal={() => {
                          const newRevealed = new Set(revealedCards);
                          newRevealed.add(i);
                          setRevealedCards(newRevealed);
                        }}
                        onReviewCard={() => setSelectedCard(cards[i])}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 grid-rows-3 pointer-events-auto" style={{ gap: '2.5vh' }}>
                <div className="col-start-2 row-start-1 transition-all duration-500">
                  {selectionPhase ? <CardPlaceholder index={2} /> : <CardImgFaceDown card={cards[2]} index={2} isRevealed={revealedCards.has(2)} canReveal={true} onReveal={() => { const n = new Set(revealedCards); n.add(2); setRevealedCards(n); }} onReviewCard={() => setSelectedCard(cards[2])} />}
                </div>
                <div className="col-start-1 row-start-2 transition-all duration-500">
                  {selectionPhase ? <CardPlaceholder index={0} /> : <CardImgFaceDown card={cards[0]} index={0} isRevealed={revealedCards.has(0)} canReveal={true} onReveal={() => { const n = new Set(revealedCards); n.add(0); setRevealedCards(n); }} onReviewCard={() => setSelectedCard(cards[0])} />}
                </div>
                <div className="col-start-2 row-start-2 transition-all duration-500">
                  {selectionPhase ? <CardPlaceholder index={4} /> : <CardImgFaceDown card={cards[4]} index={4} isRevealed={revealedCards.has(4)} canReveal={true} onReveal={() => { const n = new Set(revealedCards); n.add(4); setRevealedCards(n); }} onReviewCard={() => setSelectedCard(cards[4])} />}
                </div>
                <div className="col-start-3 row-start-2 transition-all duration-500">
                  {selectionPhase ? <CardPlaceholder index={1} /> : <CardImgFaceDown card={cards[1]} index={1} isRevealed={revealedCards.has(1)} canReveal={true} onReveal={() => { const n = new Set(revealedCards); n.add(1); setRevealedCards(n); }} onReviewCard={() => setSelectedCard(cards[1])} />}
                </div>
                <div className="col-start-2 row-start-3 transition-all duration-500">
                  {selectionPhase ? <CardPlaceholder index={3} /> : <CardImgFaceDown card={cards[3]} index={3} isRevealed={revealedCards.has(3)} canReveal={true} onReveal={() => { const n = new Set(revealedCards); n.add(3); setRevealedCards(n); }} onReviewCard={() => setSelectedCard(cards[3])} />}
                </div>
              </div>
            )}
          </>
        </div>

      {/* CAPA 4: SCROLL DE TEXTO (Encima de todo) */}
      <div className="relative z-30 w-full flex flex-col items-center pointer-events-none">
        {/* Espaciador para que el texto empiece abajo */}
        <div className="h-[75vh] w-full" />

        <div className="w-full max-w-2xl bg-black/60 backdrop-blur-md p-8 rounded-t-[40px] border-t border-amber-900/40 min-h-[60vh] pointer-events-auto">
          <div className="prose prose-invert prose-amber max-w-none font-serif text-lg leading-relaxed mb-12">
            {!selectionPhase && (text.length > 0 || loading) ? (
              <>
                {text.length > 0 ? (
                  <NarrativeResponse
                    text={text}
                    cards={cards}
                    onCardClick={(cardIndex) => {
                      if (cardIndex >= 0 && cardIndex < cards.length) {
                        setSelectedCard(cards[cardIndex]);
                      }
                    }}
                  />
                ) : loading ? (
                  <div className="pt-4 text-center">
                    <div className="inline-block animate-pulse text-amber-700 text-sm">Aura está tejiendo la respuesta...</div>
                  </div>
                ) : null}
              </>
            ) : !selectionPhase ? (
              <div className="animate-pulse text-amber-700 italic">Invocando el oráculo...</div>
            ) : null}
          </div>

          {!loading && text.length > 50 && !selectionPhase && (
            <div className="pb-10 flex justify-center">
              <button onClick={() => window.location.href = '/'} className="px-10 py-4 bg-amber-900/40 border border-amber-600/50 text-amber-500 rounded-full italic font-serif hover:bg-amber-800/40 transition-all active:scale-95 shadow-xl">
                {t.reading.new_reading}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CAPA 5: MODAL DE DETALLE */}
      <CardDetail
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        info={selectedCard?.meaning || ""}
      />

    </div>
  );
}

/**
 * Componente de Mazo Extendido
 * Muestra todas las 22 cartas del tarot solapadas horizontalmente
 */
interface ExpandedDeckProps {
  selectedIndices: Set<number>;
  onCardClick: (index: number) => void;
  cardsToSelect: number;
}

function ExpandedDeck({ selectedIndices, onCardClick, cardsToSelect }: ExpandedDeckProps) {
  const tarotCards = 22;
  const cardWidth = 45;
  const overlap = 27;
  const containerWidth = (tarotCards - 1) * (cardWidth - overlap) + cardWidth;

  return (
    <AnimatePresence>
      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto">
        <div className="relative" style={{ width: containerWidth, height: 140 }}>
          {Array.from({ length: tarotCards }).map((_, index) => {
            const isSelected = selectedIndices.has(index);
            const canSelect = selectedIndices.size < cardsToSelect;
            const layoutId = `card-${index}`;

            return (
              <motion.div
                key={index}
                layoutId={isSelected ? layoutId : undefined}
                className={`absolute h-[19.2vh] aspect-[2/3.2] rounded-sm border-2 transition-all duration-500 cursor-pointer overflow-hidden ${isSelected
                  ? 'opacity-0 scale-0 pointer-events-none'
                  : canSelect
                    ? 'border-amber-700 hover:scale-125 hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-900/50'
                    : 'border-amber-700/50 opacity-60 cursor-not-allowed'
                  }`}
                style={{
                  left: `${index * (cardWidth - overlap)}px`,
                  top: '0',
                  transform: isSelected ? 'scale(0)' : 'scale(1)'
                }}
                animate={{
                  opacity: isSelected ? 0 : 1,
                  scale: isSelected ? 0 : 1
                }}
                transition={{ duration: 0.5 }}
                onClick={() => {
                  if (canSelect && !isSelected) {
                    onCardClick(index);
                  }
                }}
              >
                <img
                  src="/dorso_PI.jpg"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                  alt="Dorso de carta"
                  style={{ WebkitFontSmoothing: 'antialiased', imageRendering: 'crisp-edges' }}
                />
              </motion.div>
            );
          })}
        </div>
        <p className="text-center text-amber-300 text-sm font-serif italic mt-6">
          Selecciona {cardsToSelect - selectedIndices.size} {cardsToSelect - selectedIndices.size === 1 ? 'carta' : 'cartas'}
        </p>
      </div>
    </AnimatePresence>
  );
}

/**
 * Componente Auxiliar CardPlaceholder
 * Placeholder invisible para animar cartas durante selección
 */
function CardPlaceholder({ index }: { index: number }) {
  const layoutId = `card-${index}`;
  
  return (
    <motion.div
      layoutId={layoutId}
      className="flex flex-col items-center pointer-events-none"
    >
      <div className="h-[19.2vh] aspect-[2/3.2] rounded-sm border-2 border-transparent" style={{ overflow: 'hidden', backfaceVisibility: 'hidden' }}>
        {/* Hueco invisible para la animación */}
      </div>
    </motion.div>
  );
}

/**
 * Componente Auxiliar CardImgFaceDown 
 * Carta boca abajo durante selección
 */
interface CardImgFaceDownProps {
  card: TarotCard;
  index: number;
  isRevealed: boolean;
  canReveal: boolean;
  onReveal: () => void;
  onReviewCard?: () => void;
}

function CardImgFaceDown({ card, index, isRevealed, canReveal, onReveal, onReviewCard }: CardImgFaceDownProps) {
  const layoutId = `card-${index}`;
  
  return (
    <motion.div
      layoutId={layoutId}
      className="flex flex-col items-center cursor-pointer group pointer-events-auto"
      onClick={(e) => {
        e.stopPropagation();
        if (canReveal && !isRevealed) {
          onReveal();
        } else if (isRevealed && onReviewCard) {
          onReviewCard();
        }
      }}
    >
      <div className={`h-[19.2vh] aspect-[2/3.2] rounded-sm border-2 shadow-2xl transition-all duration-500 ${isRevealed ? 'card-flip card-glow border-amber-500 cursor-pointer hover:scale-105 hover:shadow-lg' : 'border-amber-700 cursor-pointer group-hover:scale-110 group-active:scale-95 hover:border-amber-500 animate-pulse'}`} style={{ overflow: 'hidden', backfaceVisibility: 'hidden', willChange: 'transform', boxShadow: canReveal && !isRevealed ? '0 0 20px rgba(217, 119, 6, 0.4), 0 0 40px rgba(217, 119, 6, 0.2)' : 'none' }}>
        {!isRevealed && (
          <img
            src="/dorso_PI.jpg"
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
            alt="Dorso"
            style={{ WebkitFontSmoothing: 'antialiased', imageRendering: 'crisp-edges' }}
          />
        )}
        {isRevealed && (
          <img
            src={getCardImageUrl(card.imageId)}
            className="w-full h-full object-contain bg-gradient-to-br from-amber-900 to-amber-950"
            alt={card.name}
            style={{ WebkitFontSmoothing: 'antialiased', imageRendering: 'crisp-edges' }}
          />
        )}
      </div>
    </motion.div>
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
      <div className="h-[12vh] aspect-[2/3.2] shadow-2xl rounded-sm border border-white/10 bg-amber-900/10 transition-all duration-300 group-hover:scale-110 group-active:scale-95 animate-pulse" style={{ backfaceVisibility: 'hidden', willChange: 'transform', boxShadow: '0 0 20px rgba(217, 119, 6, 0.4), 0 0 40px rgba(217, 119, 6, 0.2)' }}>
        <img
          src={getCardImageUrl(card.imageId)}
          className="w-full h-full object-contain"
          alt={card.name}
          style={{ backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased', imageRendering: 'crisp-edges' }}
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
