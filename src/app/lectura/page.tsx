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
  const formatParam = searchParams.get("format") || "pi_simple_5";
  
  const [text, setText] = useState("");
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [selectionPhase, setSelectionPhase] = useState(true);
  const [streamSections, setStreamSections] = useState<{ [key: string]: string }>({});
  const [selectedDeckIndices, setSelectedDeckIndices] = useState<Set<number>>(new Set());
  const hasStarted = useRef(false);

 const { t, currentLang, aiInstruction } = getI18n(langParam);

  // Parsear etiquetas con regex en tiempo real
  const parseSections = (fullText: string) => {
    const regex = /\[(C1|C2|C3|C4|C5|RESUMEN)\]([\s\S]*?)(?=\[(?:C1|C2|C3|C4|C5|RESUMEN)\]|$)/g;
    const sections: { [key: string]: string } = {};
    let introduction = "";
    let lastIndex = 0;

    let match;
    while ((match = regex.exec(fullText)) !== null) {
      const tag = match[1];
      const content = match[2].trim();
      sections[tag] = content;
      lastIndex = match.index + match[0].length;
    }

    // Extraer introducción (texto antes de la primera etiqueta)
    const firstTagIndex = fullText.search(/\[(C1|C2|C3|C4|C5|RESUMEN)\]/);
    if (firstTagIndex > 0) {
      introduction = fullText.substring(0, firstTagIndex).trim();
    }

    return { sections, introduction };
  };

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
    setStreamSections({});
    
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
            personality_prompt: "morvan",
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
                  setText(prev => {
                    const combined = prev + data.text;
                    
                    // Parsear en tiempo real
                    const regex = /\[(C1|C2|C3|C4|C5|RESUMEN)\]([\s\S]*?)(?=\[(?:C1|C2|C3|C4|C5|RESUMEN)\]|$)/g;
                    const sections: { [key: string]: string } = {};
                    let match;
                    while ((match = regex.exec(combined)) !== null) {
                      sections[match[1]] = match[2].trim();
                    }
                    console.log("[v0] Secciones parseadas:", Object.keys(sections));
                    setStreamSections(sections);
                    
                    return combined;
                  });
                }
              } catch (e) {
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
  }, [question, t.reading.error, currentLang, formatParam]);

  if (cards.length === 0) return <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 italic">Invocando el umbral...</div>;

  // Configurar layout según el número de cartas
  const renderCards = () => {
    if (cards.length === 1) {
      // Oráculo Directo: 1 carta centrada
      return (
        <div className="grid grid-cols-1 place-items-center pointer-events-auto">
          <CardImg card={cards[0]} label={t.reading.labels.veredicto} onClick={() => setSelectedCard(cards[0])} />
        </div>
      );
    } else if (cards.length === 3) {
      // Línea Temporal: 3 cartas horizontales
      return (
        <div 
          className="grid grid-cols-3 pointer-events-auto" 
          style={{ 
            gap: '3vh' 
          }}
        >
          <CardImg card={cards[0]} label={t.reading.labels.pasado} onClick={() => setSelectedCard(cards[0])} />
          <CardImg card={cards[1]} label={t.reading.labels.presente} onClick={() => setSelectedCard(cards[1])} />
          <CardImg card={cards[2]} label={t.reading.labels.futuro} onClick={() => setSelectedCard(cards[2])} />
        </div>
      );
    } else {
      // La Encrucijada: 5 cartas en cruz
      return (
        <div 
          className="grid grid-cols-3 grid-rows-3 pointer-events-auto" 
          style={{ 
            gap: '2.5vh' 
          }}
        >
          <div className="col-start-2 row-start-1"><CardImg card={cards[2]} label={t.reading.labels.mente} onClick={() => setSelectedCard(cards[2])} /></div>
          <div className="col-start-1 row-start-2"><CardImg card={cards[0]} label={t.reading.labels.pasado} onClick={() => setSelectedCard(cards[0])} /></div>
          <div className="col-start-2 row-start-2"><CardImg card={cards[4]} label={t.reading.labels.presente} onClick={() => setSelectedCard(cards[4])} /></div>
          <div className="col-start-3 row-start-2"><CardImg card={cards[1]} label={t.reading.labels.futuro} onClick={() => setSelectedCard(cards[1])} /></div>
          <div className="col-start-2 row-start-3"><CardImg card={cards[3]} label={t.reading.labels.raices} onClick={() => setSelectedCard(cards[3])} /></div>
        </div>
      );
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-amber-50 overflow-y-auto overflow-x-hidden scroll-smooth">
      
      {/* CAPA 1: FONDO FIJO (La foto de portada) */}
      <div className="fixed inset-0 h-screen w-full overflow-hidden z-0 pointer-events-none flex justify-center items-center">
        <img src="/portada.jpg" className="w-full h-full object-cover" alt="Portada" />
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
            
            // Cuando se seleccionan todas, pasar a fase de revelar
            if (newSelected.size === cards.length) {
              setSelectionPhase(false);
            }
          }}
        />
      )}

      {/* CAPA 3: LAS CARTAS (Lienzo 3D independiente) */}
      {/* Mostrar cartas boca abajo solo después de seleccionar del mazo */}
      <div className="fixed inset-0 h-screen w-full flex justify-center items-center z-10 pointer-events-none" style={{ perspective: '120vh' }}>
          {!selectionPhase && (
            <>
              {cards.length === 1 ? (
                <div className="grid grid-cols-1 place-items-center pointer-events-auto">
                  <div className="transition-all duration-500 opacity-100 scale-100">
                    <CardImgFaceDown 
                      card={cards[0]} 
                      index={0}
                      isRevealed={revealedCards.has(0)}
                      canReveal={revealedCards.size === 0}
                      onReveal={() => {
                        const newRevealed = new Set(revealedCards);
                        newRevealed.add(0);
                        setRevealedCards(newRevealed);
                        setSelectedCard(cards[0]);
                      }}
                      onReviewCard={() => setSelectedCard(cards[0])}
                    />
                  </div>
                </div>
              ) : cards.length === 3 ? (
                <div className="grid grid-cols-3 pointer-events-auto" style={{ gap: '3vh' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="transition-all duration-500 opacity-100 scale-100">
                      <CardImgFaceDown 
                        card={cards[i]} 
                        index={i}
                        isRevealed={revealedCards.has(i)}
                        canReveal={revealedCards.size === i}
                        onReveal={() => {
                          const newRevealed = new Set(revealedCards);
                          newRevealed.add(i);
                          setRevealedCards(newRevealed);
                          setSelectedCard(cards[i]);
                        }}
                        onReviewCard={() => setSelectedCard(cards[i])}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 grid-rows-3 pointer-events-auto" style={{ gap: '2.5vh' }}>
                  <div className="col-start-2 row-start-1 transition-all duration-500 opacity-100 scale-100">
                    <CardImgFaceDown card={cards[2]} index={2} isRevealed={revealedCards.has(2)} canReveal={revealedCards.size === 2} onReveal={() => { const n = new Set(revealedCards); n.add(2); setRevealedCards(n); setSelectedCard(cards[2]); }} onReviewCard={() => setSelectedCard(cards[2])} />
                  </div>
                  <div className="col-start-1 row-start-2 transition-all duration-500 opacity-100 scale-100">
                    <CardImgFaceDown card={cards[0]} index={0} isRevealed={revealedCards.has(0)} canReveal={revealedCards.size === 0} onReveal={() => { const n = new Set(revealedCards); n.add(0); setRevealedCards(n); setSelectedCard(cards[0]); }} onReviewCard={() => setSelectedCard(cards[0])} />
                  </div>
                  <div className="col-start-2 row-start-2 transition-all duration-500 opacity-100 scale-100">
                    <CardImgFaceDown card={cards[4]} index={4} isRevealed={revealedCards.has(4)} canReveal={revealedCards.size === 4} onReveal={() => { const n = new Set(revealedCards); n.add(4); setRevealedCards(n); setSelectedCard(cards[4]); }} onReviewCard={() => setSelectedCard(cards[4])} />
                  </div>
                  <div className="col-start-3 row-start-2 transition-all duration-500 opacity-100 scale-100">
                    <CardImgFaceDown card={cards[1]} index={1} isRevealed={revealedCards.has(1)} canReveal={revealedCards.size === 1} onReveal={() => { const n = new Set(revealedCards); n.add(1); setRevealedCards(n); setSelectedCard(cards[1]); }} onReviewCard={() => setSelectedCard(cards[1])} />
                  </div>
                  <div className="col-start-2 row-start-3 transition-all duration-500 opacity-100 scale-100">
                    <CardImgFaceDown card={cards[3]} index={3} isRevealed={revealedCards.has(3)} canReveal={revealedCards.size === 3} onReveal={() => { const n = new Set(revealedCards); n.add(3); setRevealedCards(n); setSelectedCard(cards[3]); }} onReviewCard={() => setSelectedCard(cards[3])} />
                  </div>
                </div>
              )}
            </>
          )}
      </div>

      {/* CAPA 4: SCROLL DE TEXTO (Encima de todo) */}
      <div className="relative z-30 w-full flex flex-col items-center pointer-events-none">
        {/* Espaciador para que el texto empiece abajo */}
        <div className="h-[88vh] w-full" />

        <div className="w-full max-w-2xl bg-black p-8 rounded-t-[40px] border-t border-amber-900/40 min-h-[60vh] pointer-events-auto">
          <div className="prose prose-invert prose-amber max-w-none font-serif text-lg leading-relaxed mb-12">
            {!selectionPhase && (text.length > 0 || loading) ? (
              (() => {
                const { sections, introduction } = parseSections(text);
                return (
                  <div className="space-y-6">
                    {/* Solo mostrar síntesis */}
                    {sections.RESUMEN ? (
                      <div className="pt-6 border-t-2 border-amber-600/50">
                        <p className="text-amber-500 font-bold text-sm uppercase mb-3">Síntesis</p>
                        <ReactMarkdown components={{ strong: ({...props}) => <span className="text-amber-400 font-bold" {...props} /> }}>
                          {sections.RESUMEN}
                        </ReactMarkdown>
                      </div>
                    ) : loading ? (
                      <div className="pt-4 text-center">
                        <div className="inline-block animate-pulse text-amber-700 text-sm">Morvan está tejiendo la síntesis...</div>
                      </div>
                    ) : null}
                  </div>
                );
              })()
            ) : !selectionPhase ? (
              <div className="animate-pulse text-amber-700 italic">Invocando el oráculo...</div>
            ) : null}
          </div>
          
          {!loading && text.length > 50 && !selectionPhase && (
            <div className="pb-10 flex justify-center">
                <button onClick={() => window.location.href='/'} className="px-10 py-4 bg-amber-900/40 border border-amber-600/50 text-amber-500 rounded-full italic font-serif hover:bg-amber-800/40 transition-all active:scale-95 shadow-xl">
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
        info={selectedCard && streamSections ? streamSections[`C${cards.indexOf(selectedCard) + 1}`] || "Cargando..." : ""}
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
  const overlap = 38;
  const containerWidth = (tarotCards - 1) * (cardWidth - overlap) + cardWidth;

  return (
    <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto">
      <div className="relative" style={{ width: containerWidth, height: 140 }}>
        {Array.from({ length: tarotCards }).map((_, index) => {
          const isSelected = selectedIndices.has(index);
          const canSelect = selectedIndices.size < cardsToSelect;
          
          return (
            <div
              key={index}
              className={`absolute h-[12vh] aspect-[2/3.2] bg-gradient-to-br from-amber-900 to-amber-950 rounded-sm border-2 transition-all duration-500 cursor-pointer ${
                isSelected
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
              onClick={() => {
                if (canSelect && !isSelected) {
                  onCardClick(index);
                }
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-amber-600 font-bold text-xl">
                ✦
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-amber-300 text-sm font-serif italic mt-6">
        Selecciona {cardsToSelect - selectedIndices.size} {cardsToSelect - selectedIndices.size === 1 ? 'carta' : 'cartas'}
      </p>
    </div>
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
  return (
    <div 
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
      <div className={`h-[12vh] aspect-[2/3.2] shadow-2xl rounded-sm border-2 transition-all duration-500 ${
        isRevealed 
          ? 'border-amber-500 bg-gradient-to-br from-amber-900 to-amber-950 cursor-pointer hover:scale-105 hover:shadow-lg' 
          : canReveal
            ? 'border-amber-700 bg-gradient-to-br from-amber-900 to-amber-950 group-hover:scale-110 group-active:scale-95 hover:border-amber-500 animate-pulse cursor-pointer'
            : 'border-amber-700/50 bg-gradient-to-br from-amber-900/50 to-amber-950/50 opacity-50 cursor-not-allowed'
      }`} style={{ backfaceVisibility: 'hidden', willChange: 'transform', boxShadow: canReveal && !isRevealed ? '0 0 20px rgba(217, 119, 6, 0.4), 0 0 40px rgba(217, 119, 6, 0.2)' : 'none' }}>
        {!isRevealed && (
          <div className="w-full h-full flex items-center justify-center text-amber-600 font-bold text-3xl">
            ✦
          </div>
        )}
        {isRevealed && (
          <img 
            src={getCardImageUrl(card.imageId)} 
            className="w-full h-full object-contain" 
            alt={card.name} 
            style={{ backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased', imageRendering: 'crisp-edges' }}
          />
        )}
      </div>
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
