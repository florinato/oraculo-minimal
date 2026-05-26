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

export function TarotFormatSelector({
  selectedFormat,
  onFormatChange,
  formats
}: TarotFormatSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="block text-amber-500/80 text-xs font-bold uppercase tracking-widest">
        Elige tu tirada
      </label>

      {/* Grid de opciones */}
      <div className="space-y-3">
        {formats.map((format) => (
          <button
            key={format.id}
            onClick={() => onFormatChange(format.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${
              selectedFormat === format.id
                ? 'border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-900/30'
                : 'border-amber-900/30 bg-black/40 hover:border-amber-700 hover:bg-black/60'
            }`}
          >
            {/* Descripción */}
            <div className="flex-1">
              <h3 className="text-amber-500 font-bold text-sm uppercase mb-1">
                {format.name}
              </h3>
              <p className="text-amber-200/70 text-xs leading-relaxed">
                {format.description}
              </p>
            </div>

            {/* Visualización de cartas */}
            <div className="flex-shrink-0">
              {format.id === 'pi_sino_1' && (
                <div className="flex justify-center">
                  <div className="w-8 h-12 bg-amber-900 border border-amber-700 rounded-sm" />
                </div>
              )}
              {format.id === 'pi_rapida_3' && (
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-6 h-10 bg-amber-900 border border-amber-700 rounded-sm" />
                  ))}
                </div>
              )}
              {format.id === 'pi_simple_5' && (
                <div className="flex flex-col items-center gap-1">
                  {/* Fila 1: 1 carta arriba */}
                  <div className="flex justify-center">
                    <div className="w-6 h-10 bg-amber-900 border border-amber-700 rounded-sm" />
                  </div>
                  {/* Fila 2: 3 cartas en el medio */}
                  <div className="flex gap-1 justify-center">
                    <div className="w-5 h-8 bg-amber-900 border border-amber-700 rounded-sm" />
                    <div className="w-5 h-8 bg-amber-900 border border-amber-700 rounded-sm" />
                    <div className="w-5 h-8 bg-amber-900 border border-amber-700 rounded-sm" />
                  </div>
                  {/* Fila 3: 1 carta abajo */}
                  <div className="flex justify-center">
                    <div className="w-6 h-10 bg-amber-900 border border-amber-700 rounded-sm" />
                  </div>
                </div>
              )}
            </div>

            {/* Indicador de selección */}
            {selectedFormat === format.id && (
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
