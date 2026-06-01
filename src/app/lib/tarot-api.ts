import es from "@/locals/es.json";
import en from "@/locals/en.json";
import fr from "@/locals/fr.json";
import ca from "@/locals/ca.json";

export interface TarotCard {
  position: number;
  name: string;
  imageId: string;
  is_reversed: boolean;
  meaning?: string;
}

// Diccionario de traducciones por idioma
const translations: Record<string, { cards: Record<string, { name: string; info: string }> }> = {
  es: es,
  en: en,
  fr: fr,
  ca: ca
};

export function getCardTranslations(lang: string = "es") {
  return (translations[lang] || translations.es).cards as Record<string, { name: string; info: string }>;
}

const defaultCardTranslations = getCardTranslations("es");
const cardIds = Object.keys(defaultCardTranslations);

export function getCardImageUrl(cardId: string | undefined): string {
  if (!cardId) {
    console.log("[v0] getCardImageUrl: cardId es undefined");
    return "";
  }
  // Leer variables en RUNTIME, no en compile time
  const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL;
  const IMG_TOKEN = process.env.NEXT_PUBLIC_IMAGE_SERVER_TOKEN;
  
  const url = `${ASSETS_URL}/media/card/${cardId}?token=${IMG_TOKEN}`;
  console.log("[v0] getCardImageUrl:", { cardId, assetsUrl: ASSETS_URL, hasToken: !!IMG_TOKEN, url });
  return url;
}

export function drawFiveCards(lang: string = "es"): TarotCard[] {
  const cardTranslations = getCardTranslations(lang);
  const shuffledIds = [...cardIds].sort(() => 0.5 - Math.random());
  
  return shuffledIds.slice(0, 5).map((id, index) => {
    const cardInfo = cardTranslations[id];
    
    return {
      position: index + 1,
      name: cardInfo.name,
      imageId: id,
      is_reversed: false,
      meaning: cardInfo.info
    };
  });
}
