import es from "@/locals/es.json";

// 1. Definimos los idiomas que la App realmente soporta
const SUPPORTED_LANGS: Record<string, any> = {
  es: es,
  // El día que tengas en.json, solo añades: en: en
};

const DEFAULT_LANG = "es";

export function getI18n(langCode?: string | null) {
  // Si no nos pasan código, intentamos detectar del navegador
  const code = langCode || (typeof window !== "undefined" ? navigator.language.split("-")[0] : DEFAULT_LANG);
  
  // Retornamos el idioma solicitado si existe, si no, el por defecto
  return {
    t: SUPPORTED_LANGS[code] || SUPPORTED_LANGS[DEFAULT_LANG],
    currentLang: SUPPORTED_LANGS[code] ? code : DEFAULT_LANG
  };
}