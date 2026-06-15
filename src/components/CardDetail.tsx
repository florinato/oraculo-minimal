"use client"
import { getCardImageUrl } from "@/app/lib/tarot-api";
import Image from "next/image";
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
      {/* TARJETA: Ocupa casi toda la pantalla del móvil */}
      <div 
        className="relative w-full h-full md:max-w-[400px] md:max-h-[90vh] flex flex-col items-center bg-[#0d0d0d] border border-amber-900/40 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 shadow-[0_0_50px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200 overflow-hidden"
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
        <h3 className="text-base md:text-lg font-serif text-amber-500 font-bold uppercase tracking-widest mb-3 md:mb-4 mt-1 md:mt-2">
          {card.name}
        </h3>

        {/* 2. CONTENEDOR DE IMAGEN: Ocupa 1/2 de la tarjeta */}
        <div className="relative w-full h-1/2 rounded-xl overflow-hidden border border-amber-900/30 bg-neutral-900">
          <Image 
            src={getCardImageUrl(card.imageId)} 
            alt={card.name}
            fill
            className="w-full h-full object-contain"
          />
        </div>

        {/* 3. TEXTO: Tamaño duplicado y visible */}
        <div className="mt-4 w-full flex-1 overflow-y-auto bg-amber-950/20 border border-amber-900/20 p-4 rounded-lg">
          <p className="text-amber-50/90 font-serif text-center text-xl md:text-2xl leading-relaxed italic whitespace-pre-line">
            {info}
          </p>
        </div>

      </div>
    </div>
  );
}
