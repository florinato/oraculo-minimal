import es from "@/locals/es.json";

// Creamos un tipo basado en tu archivo de español
export type TranslationSchema = typeof es;

// Definimos que este objeto acepta cualquier código de idioma (string) pero el contenido sigue el molde
const SUPPORTED_LANGS: Record<string, TranslationSchema> = {
  es: es,
};

const DEFAULT_LANG = "es";

export function getI18n(langCode?: string | null) {
  const code = langCode || (typeof window !== "undefined" ? navigator.language.split("-")[0] : DEFAULT_LANG);
  
  // Si el idioma no está soportado, devolvemos el español
  const t = SUPPORTED_LANGS[code] || SUPPORTED_LANGS[DEFAULT_LANG];
  
  return { t, currentLang: SUPPORTED_LANGS[code] ? code : DEFAULT_LANG };
}