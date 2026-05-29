"use client"
import React from "react";

interface NarrativeResponseProps {
  text: string;
  cards: Array<{ name: string; position: number }>;
  onCardClick: (cardIndex: number) => void;
}

/**
 * Componente NarrativeResponse
 * Renderiza el texto narrativo de la respuesta de la API en Modo Narrativo
 * - Detecta referencias a cartas: [C1]nombre[/C1]
 * - Las convierte en links interactivos (dorados y subrayados)
 * - Renderiza el mantra final (texto después de [RES]) en itálica destacada
 * - Limpia todas las etiquetas de formato del texto visible
 */
export default function NarrativeResponse({ text, cards, onCardClick }: NarrativeResponseProps) {
  // Detectar la sección [RES]...[/RES]
  const resMatch = text.match(/\[RES\]([\s\S]*?)(?:\[\/RES\]|$)/);
  const mantra = resMatch ? resMatch[1].trim() : "";

  // Remover las etiquetas [RES] del texto para procesamiento
  const processedText = text.replace(/\[RES\]|\[\/RES\]/g, "");

  // Regex para detectar cartas: [C1]El Mago[/C1]
  const cardRegex = /\[C(\d)\](.*?)\[\/C\1\]/g;

  // Función para renderizar el texto con links de cartas
  const renderTextWithCardLinks = () => {
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;
    const regex = new RegExp(cardRegex);

    while ((match = regex.exec(processedText)) !== null) {
      // Texto antes del match
      if (match.index > lastIndex) {
        parts.push(processedText.substring(lastIndex, match.index));
      }

      const cardNumber = parseInt(match[1], 10);
      const cardName = match[2];
      const cardIndex = cardNumber - 1; // Convertir a índice de array (0-based)

      // Validar que el índice sea válido
      if (cardIndex >= 0 && cardIndex < cards.length) {
        // Crear link de carta
        parts.push(
          <button
            key={`card-${match.index}`}
            onClick={(e) => {
              e.preventDefault();
              onCardClick(cardIndex);
            }}
            className="text-amber-400 underline hover:text-amber-300 transition-colors font-serif active:scale-95"
            style={{ 
              background: "none", 
              border: "none", 
              padding: "0", 
              cursor: "pointer",
              display: "inline"
            }}
          >
            {cardName}
          </button>
        );
      } else {
        // Si el índice no es válido, solo mostrar el nombre
        parts.push(cardName);
      }

      lastIndex = match.index + match[0].length;
    }

    // Texto restante
    if (lastIndex < processedText.length) {
      parts.push(processedText.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="space-y-6">
      {/* TEXTO NARRATIVO PRINCIPAL */}
      <div className="text-amber-50 font-serif text-base md:text-lg leading-relaxed whitespace-pre-wrap">
        {renderTextWithCardLinks()}
      </div>

      {/* MANTRA FINAL (después de [RES]) */}
      {mantra && (
        <div className="pt-6 border-t-2 border-amber-600/50">
          <p className="text-amber-500 font-bold text-xs uppercase mb-3 tracking-widest">
            Mantra
          </p>
          <p className="text-amber-50/80 font-serif italic text-base md:text-lg leading-relaxed text-center">
            &quot;{mantra}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
