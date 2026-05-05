import es from "@/locals/es.json";

export interface TarotCard {
  position: number;
  name: string;
  imageId: string;
  is_reversed: boolean;
}

const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL;
const IMG_TOKEN = process.env.NEXT_PUBLIC_IMAGE_SERVER_TOKEN;

// LA SOLUCIÓN: Forzamos a que las llaves se traten como un diccionario (Record)
const cardTranslations = es.cards as Record<string, { name: string; info: string }>;
const cardIds = Object.keys(cardTranslations);

export function getCardImageUrl(cardId: string | undefined): string {
  if (!cardId) {
    console.log("[v0] getCardImageUrl: cardId es undefined");
    return "";
  }
  const url = `${ASSETS_URL}/media/card/${cardId}?token=${IMG_TOKEN}`;
  console.log("[v0] getCardImageUrl:", { cardId, assetsUrl: ASSETS_URL, hasToken: !!IMG_TOKEN, url });
  return url;
}

export function drawFiveCards(): TarotCard[] {
  const shuffledIds = [...cardIds].sort(() => 0.5 - Math.random());
  
  return shuffledIds.slice(0, 5).map((id, index) => {
    // Ahora cardTranslations[id] ya no da error porque arriba dijimos que acepta strings
    const cardInfo = cardTranslations[id];
    
    return {
      position: index + 1,
      name: cardInfo.name,
      imageId: id,
      is_reversed: false
    };
  });
}
