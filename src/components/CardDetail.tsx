"use client"
import { getCardImageUrl } from "@/app/lib/tarot-api";
import { X } from "lucide-react";

interface CardDetailProps {
  card: { name: string; imageId: string } | null;
  onClose: () => void;
  info: string;
}

export default function CardDetail({ card, onClose, info }: CardDetailProps) {
  if (!card) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm touch-none"
      onClick={onClose}
    >
      {/* TARJETA: Limitamos el ancho y el alto máximo para que no se salga del móvil */}
      <div 
        className="relative w-full max-w-[320px] max-h-[90vh] flex flex-col items-center bg-[#0d0d0d] border border-amber-900/40 rounded-[2.5rem] p-6 shadow-[0_0_50px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* BOTÓN X: Posición fija relativa a la tarjeta */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[110] bg-amber-600 text-black rounded-full p-1.5 shadow-lg active:scale-90 transition-transform"
        >
          <X size={18} strokeWidth={3} />
        </button>

        {/* 1. TÍTULO */}
        <h3 className="text-lg font-serif text-amber-500 font-bold uppercase tracking-widest mb-4 mt-2">
          {card.name}
        </h3>

        {/* 2. CONTENEDOR DE IMAGEN: La clave está en flex-1 y min-h-0 */}
        <div className="relative w-full flex-1 min-h-0 rounded-xl overflow-hidden border border-amber-900/30 bg-neutral-900">
          <img 
            src={getCardImageUrl(card.imageId)} 
            className="w-full h-full object-contain" // Cambiado a contain para que nunca se corte la ilustración
            alt={card.name}
          />
        </div>

        {/* 3. TEXTO: Se ajusta al espacio sobrante */}
        <div className="mt-4 w-full bg-amber-950/20 border border-amber-900/20 p-4 rounded-xl">
          <p className="text-amber-50/90 font-serif text-center text-sm leading-tight italic">
            {info}
          </p>
        </div>

      </div>
    </div>
  );
}