const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL;
const IMG_TOKEN = process.env.NEXT_PUBLIC_IMAGE_SERVER_TOKEN;

const cardNameMap: Record<string, string> = {
  "El Loco": "00-thefool",
  "El Mago": "01-themagician",
  "La Suma Sacerdotisa": "02-thehighpriestess",
  "La Papisa": "02-thehighpriestess", 
  "La Emperatriz": "03-theempress",
  "El Emperador": "04-theemperor",
  "El Sumo Sacerdote": "05-thehierophant",
  "Los Enamorados": "06-thelovers",
  "El Carro": "07-thechariot",
  "La Fuerza": "08-strength",
  "El Ermitaño": "09-thehermit",
  "La Rueda de la Fortuna": "10-wheeloffortune",
  "La Justicia": "11-justice",
  "El Colgado": "12-thehangedman",
  "La Muerte": "13-death",
  "La Templanza": "14-temperance",
  "El Diablo": "15-thedevil",
  "La Torre": "16-thetower",
  "La Estrella": "17-thestar",
  "La Luna": "18-themoon",
  "El Sol": "19-thesun",
  "El Juicio": "20-judgement",
  "El Mundo": "21-theworld",
};

/**
 * Genera la URL de la imagen para el navegador
 */
export function getCardImageUrl(cardName: string | undefined): string {
  if (!cardName) return "";
  const cleanName = cardName.trim();
  let cardId = cardNameMap[cleanName];

  // Buscador de respaldo (por si hay tildes o mayúsculas distintas)
  if (!cardId) {
    const normalizedSearch = cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matchingKey = Object.keys(cardNameMap).find(key =>
      key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedSearch
    );
    if (matchingKey) cardId = cardNameMap[matchingKey];
  }

  if (!cardId) return "";

  return `${ASSETS_URL}/media/card/${cardId}?token=${IMG_TOKEN}`;
}

/**
 * Mezcla y devuelve 5 objetos de carta completos
 */
export function drawFiveCards() {
  // Evitamos duplicados de La Papisa / Suma Sacerdotisa
  const names = Object.keys(cardNameMap).filter(n => n !== "La Papisa");
  const shuffled = [...names].sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, 5).map((name, index) => {
    return {
      position: index + 1,
      name: name,
      // VITAL: Guardamos el imageId aquí para que el detalle sepa qué buscar en el JSON
      imageId: cardNameMap[name], 
      is_reversed: false
    };
  });
}

// Logs de ayuda en consola
if (typeof window !== "undefined") {
  console.log("DEBUG ASSETS:", ASSETS_URL);
}