import ca from "@/locals/ca.json";
import en from "@/locals/en.json";
import es from "@/locals/es.json";
import fr from "@/locals/fr.json";
export type TranslationSchema = typeof es;

const SUPPORTED_LANGS: Record<string, TranslationSchema> = {
  es: es,
  en: en as TranslationSchema,
  fr: fr as TranslationSchema,
  ca: ca as TranslationSchema,
};

// AÑADIMOS LAS INSTRUCCIONES SECRETAS DE GEMINI
export const LANGUAGE_CONFIG: Record<string, { code: string; flag: string; name: string; instruction: string }> = {
  es: { 
    code: "es", 
    flag: "🇪🇸", 
    name: "Español", 
    instruction: "" // El backend asume español si está vacío
  },
  en: { 
    code: "en", 
    flag: "🇬🇧", 
    name: "English", 
    instruction: "Answer the whole response strictly in ENGLISH." 
  },
  fr: { 
    code: "fr", 
    flag: "🇫🇷", 
    name: "Français", 
    instruction: "Répondez à toute la réponse strictement en FRANÇAIS." 
  },
  ca: { 
    code: "ca", 
    flag: "CAT", 
    name: "Català", 
    instruction: "Answer the whole response strictly in CATALAN." 
  },
};

const DEFAULT_LANG = "es";

export function getI18n(langCode?: string | null) {
  const code = langCode || (typeof window !== "undefined" ? navigator.language.split("-")[0] : DEFAULT_LANG);
  
  const finalCode = SUPPORTED_LANGS[code] ? code : DEFAULT_LANG;
  const t = SUPPORTED_LANGS[finalCode];
  
  return { 
    t, 
    currentLang: finalCode,
    // Exportamos la instrucción para pasársela a la API
    aiInstruction: LANGUAGE_CONFIG[finalCode]?.instruction || "" 
  };
}