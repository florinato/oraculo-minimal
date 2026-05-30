"use client"

interface TarotFormatSelectorProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  formats: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

// Helpers para dibujar los iconos en SVG
const Icons = {
  Cards5: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" className="w-10 h-10">
      <path d="M4 8l2-4 12 4-2 14-12-4 2-14z" />
      <path d="M7 6l1-5 13 3-2 15-13-3 1-5" />
      <rect x="5" y="7" width="10" height="14" rx="1" transform="rotate(-10 5 7)" />
      <rect x="7" y="5" width="10" height="14" rx="1" />
      <rect x="9" y="4" width="10" height="14" rx="1" transform="rotate(10 9 4)" />
    </svg>
  ),
  Cards3: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" className="w-10 h-10">
      <rect x="5" y="6" width="10" height="14" rx="1" transform="rotate(-15 5 6)" />
      <rect x="7" y="5" width="10" height="14" rx="1" />
      <rect x="9" y="5" width="10" height="14" rx="1" transform="rotate(15 9 5)" />
    </svg>
  ),
  Scale: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <path d="M12 3v18" />
      <path d="M3 7h18" />
      <path d="M3 7l2 8c0 1.5 2 1.5 4 1.5s4 0 4-1.5l-2-8" />
      <path d="M15 7l2 8c0 1.5 2 1.5 4 1.5s4 0 4-1.5l-2-8" />
      <path d="M9 21h6" />
    </svg>
  )
};

export function TarotFormatSelector({
  selectedFormat,
  onFormatChange,
  formats
}: TarotFormatSelectorProps) {
  
  const getIcon = (id: string) => {
    if (id === 'pi_simple_5') return <Icons.Cards5 />;
    if (id === 'pi_rapida_3') return <Icons.Cards3 />;
    if (id === 'pi_sino_1') return <Icons.Scale />;
    return <Icons.Cards3 />;
  }

  return (
    <div className="space-y-4">
      {/* Grid de opciones */}
      <div className="space-y-3">
        {formats.map((format) => {
          const isSelected = selectedFormat === format.id;
          
          return (
            <button
              key={format.id}
              onClick={() => onFormatChange(format.id)}
              className={`w-full text-left transition-all duration-300 rounded-xl border-[1.5px] p-1 
                ${isSelected 
                  ? 'border-[#E5C158] shadow-[0_0_20px_rgba(229,193,88,0.25)] scale-[1.02] bg-black/60' 
                  : 'border-[#E5C158]/30 hover:border-[#E5C158]/60 bg-black/40 hover:bg-black/50'
                }`}
            >
              {/* Contenedor interno que hace el efecto del segundo borde */}
              <div className={`flex items-center h-full rounded-lg border transition-all duration-300 p-3 md:p-4
                ${isSelected 
                  ? 'border-[#E5C158]/50 bg-[#130E24]/90' 
                  : 'border-[#E5C158]/20 bg-[#130E24]/60'
                }`}
              >
                
                {/* Icono a la izquierda */}
                <div className={`flex-shrink-0 flex items-center justify-center mr-4 md:mr-6 transition-colors duration-300
                  ${isSelected ? 'text-[#E5C158]' : 'text-[#E5C158]/50'}`}
                >
                  {getIcon(format.id)}
                </div>

                {/* Textos apilados */}
                <div className="flex flex-col justify-center flex-1">
                  <h3 className={`font-serif font-bold uppercase tracking-wider text-base md:text-lg transition-colors duration-300
                    ${isSelected ? 'text-[#E5C158] drop-shadow-md' : 'text-[#E5C158]/70'}`}
                  >
                    {format.name}
                  </h3>
                  
                  {/* Subtítulo tipo "- TIRADA 5 CARTAS" */}
                  <span className={`text-xs uppercase tracking-widest mt-1 font-sans transition-colors duration-300
                    ${isSelected ? 'text-[#E5C158]/90' : 'text-[#E5C158]/40'}`}
                  >
                    - {format.description.substring(0, 25)}...
                  </span>
                </div>

              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
}
