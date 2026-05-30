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

// Componente reutilizable para mostrar cartas en posiciones
const CardPlaceholder = ({ className = "" }) => (
  <div className={`w-6 h-8 md:w-8 md:h-10 rounded border border-[#E5C158]/80 bg-gradient-to-br from-[#E5C158]/20 to-[#E5C158]/5 ${className}`} />
);

// Estructura de 5 cartas (1 arriba, 3 al medio, 1 abajo)
const Cards5Layout = ({ isSelected }: { isSelected: boolean }) => (
  <div className="flex flex-col items-center justify-center gap-1.5">
    {/* Carta superior */}
    <CardPlaceholder className={isSelected ? "border-[#E5C158]" : ""} />
    {/* Fila de 3 cartas */}
    <div className="flex gap-1.5">
      <CardPlaceholder className={isSelected ? "border-[#E5C158]" : ""} />
      <CardPlaceholder className={isSelected ? "border-[#E5C158]" : ""} />
      <CardPlaceholder className={isSelected ? "border-[#E5C158]" : ""} />
    </div>
    {/* Carta inferior */}
    <CardPlaceholder className={isSelected ? "border-[#E5C158]" : ""} />
  </div>
);

// Estructura de 3 cartas (seguidas en fila)
const Cards3Layout = ({ isSelected }: { isSelected: boolean }) => (
  <div className="flex gap-1.5 items-center justify-center">
    <CardPlaceholder className={isSelected ? "border-[#E5C158]" : ""} />
    <CardPlaceholder className={isSelected ? "border-[#E5C158]" : ""} />
    <CardPlaceholder className={isSelected ? "border-[#E5C158]" : ""} />
  </div>
);

// Estructura de 1 carta (Yes/No)
const Card1Layout = ({ isSelected }: { isSelected: boolean }) => (
  <div className="flex gap-1.5 items-center justify-center">
    <CardPlaceholder className={isSelected ? "border-[#E5C158]" : ""} />
  </div>
);

export function TarotFormatSelector({
  selectedFormat,
  onFormatChange,
  formats
}: TarotFormatSelectorProps) {
  
  const getCardLayout = (id: string, isSelected: boolean) => {
    if (id === 'pi_simple_5') return <Cards5Layout isSelected={isSelected} />;
    if (id === 'pi_rapida_3') return <Cards3Layout isSelected={isSelected} />;
    if (id === 'pi_sino_1') return <Card1Layout isSelected={isSelected} />;
    return <Cards3Layout isSelected={isSelected} />;
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
              className={`w-full text-left transition-all duration-300 rounded-xl border-[1.5px] p-0 
                ${isSelected 
                  ? 'border-[#E5C158] shadow-[0_0_20px_rgba(229,193,88,0.25)] scale-[1.02] bg-black/60' 
                  : 'border-[#E5C158]/30 hover:border-[#E5C158]/60 bg-black/40 hover:bg-black/50'
                }`}
            >
              {/* Contenedor interno que hace el efecto del segundo borde */}
              <div className={`flex items-center h-full rounded-lg border transition-all duration-300 p-2 md:p-3
                ${isSelected 
                  ? 'border-[#E5C158]/50 bg-[#130E24]/90' 
                  : 'border-[#E5C158]/20 bg-[#130E24]/60'
                }`}
              >
                
                {/* Icono a la izquierda */}
                <div className={`flex-shrink-0 flex items-center justify-center mr-3 md:mr-4 transition-colors duration-300
                  ${isSelected ? 'text-[#E5C158]' : 'text-[#E5C158]/50'}`}
                >
                  {getCardLayout(format.id, isSelected)}
                </div>

                {/* Textos apilados */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h3 className={`font-serif font-bold uppercase tracking-wider text-base md:text-lg transition-colors duration-300 break-words
                    ${isSelected ? 'text-[#E5C158] drop-shadow-md' : 'text-[#E5C158]/70'}`}
                  >
                    {format.name}
                  </h3>
                  
                  {/* Subtítulo tipo "- TIRADA 5 CARTAS" */}
                  <span className={`text-xs uppercase tracking-widest mt-1 font-sans transition-colors duration-300 break-words
                    ${isSelected ? 'text-[#E5C158]/90' : 'text-[#E5C158]/40'}`}
                  >
                    - {format.description}
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
