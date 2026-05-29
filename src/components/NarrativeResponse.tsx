"use client"
import React from "react";

interface NarrativeResponseProps {
  text: string;
  cards: Array<{ name: string; position: number }>;
  onCardClick: (cardIndex: number) => void;
}

/**
 * Componente NarrativeResponse
 * Renderiza el texto narrativo de la respuesta en Modo Narrativo:
 * - Detecta referencias a cartas: [C1]Nombre[/C1] hasta [C5]Nombre[/C5]
 * - Convierte el nombre en un link clickeable (dorado y subrayado)
 * - Identifica [RES]....[/RES] para el mantra final con estilo diferenciado
 * - Limpia todas las etiquetas del texto visible
 */
export default function NarrativeResponse({ text, cards, onCardClick }: NarrativeResponseProps) {
  // Extraer la sección [RES]...[/RES] para el mantra
  const resMatch = text.match(/\[RES\]([\s\S]*?)(?:\[\/RES\]|$)/);
  const mantra = resMatch ? resMatch[1].trim() : "";

  // Remover las etiquetas [RES] del texto principal
  const mainText = text.replace(/\[RES\][\s\S]*?(?:\[\/RES\]|$)/g, "").trim();

  // Función para renderizar el texto con links de cartas interactivos
  const renderTextWithCardLinks = () => {
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    // Crear regex fresh cada vez para evitar problemas con state global
    const cardRegex = /\[C([1-5])\](.*?)\[\/C\1\]/;
    let workingText = mainText;
    let matchCount = 0;

    while (matchCount < 100 && (match = workingText.match(cardRegex)) !== null) {
      const cardNumber = parseInt(match[1], 10);
      const cardName = match[2];
      const cardIndex = cardNumber - 1; // Convertir a índice 0-based

      // Texto antes del match
      const beforeMatch = workingText.substring(0, match.index);
      if (beforeMatch) {
        parts.push(beforeMatch);
      }

      // Validar que el índice sea válido
      if (cardIndex >= 0 && cardIndex < cards.length) {
        // Crear botón clickeable que abre el modal
        parts.push(
          <button
            key={`card-link-${matchCount}`}
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
              display: "inline",
              fontFamily: "inherit",
              fontSize: "inherit",
            }}
          >
            {cardName}
          </button>
        );
      } else {
        // Si el índice no es válido, mostrar solo el nombre
        parts.push(cardName);
      }

      // Continuar con el texto restante
      workingText = workingText.substring(match.index + match[0].length);
      matchCount++;
    }

    // Agregar texto restante
    if (workingText) {
      parts.push(workingText);
    }

    return parts.length > 0 ? parts : mainText;
  };

  return (
    <div className="space-y-6">
      {/* TEXTO NARRATIVO PRINCIPAL */}
      <div className="text-amber-50 font-serif text-base md:text-lg leading-relaxed whitespace-pre-wrap">
        {renderTextWithCardLinks()}
      </div>

      {/* MANTRA FINAL (texto después de [RES]) */}
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
