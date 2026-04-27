"use client"
import { getCardImageUrl } from "@/app/lib/tarot-api";
import { X } from "lucide-react"; // Importamos la X de Lucide

interface CardDetailProps {
  card: { name: string; imageId: string } | null;
  onClose: () => void;
  info: string;
}

export default function CardDetail({ card, onClose, info }: CardDetailProps) {
  if (!card) return null;

  return (
    <div 
      className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4 touch-none"
      onClick={onClose}
    >
      {/* Contenedor relativo para posicionar la X en el vértice */}
      <div 
        className="relative w-full max-w-85 flex flex-col items-center gap-3 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* BOTÓN X: En el vértice superior derecho */}
        <button 
          onClick={onClose}
          className="absolute -top-2 -right-2 z-110 bg-amber-600 text-black rounded-full p-1.5 shadow-xl active:scale-90 transition-transform"
        >
          <X size={24} strokeWidth={3} />
        </button>

        {/* Título de la carta */}
        <h3 className="text-xl font-serif text-amber-500 font-bold uppercase tracking-tighter">
          {card.name}
        </h3>

        {/* Imagen de la carta: Aprovechando el 80% del ancho del modal */}
        <div className="w-full aspect-2/3.5 rounded-xl overflow-hidden border-2 border-amber-900/50 shadow-[0_0_30px_rgba(0,0,0,1)] bg-neutral-900">
          <img 
            src={getCardImageUrl(card.name)} 
            className="w-full h-full object-cover"
            alt={card.name}
          />
        </div>

        {/* Info: Caja mínima pegada a la carta */}
        <div className="bg-amber-900/10 border border-amber-900/30 p-3 rounded-lg w-full">
          <p className="text-amber-50/90 font-serif text-center text-sm leading-tight italic">
            "{info}"
          </p>
        </div>
      </div>
    </div>
  );
}