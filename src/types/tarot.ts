export interface TarotCard {
  position: number;
  name: string;
  imageId: string;
  is_reversed: boolean;
}

export interface TranslationSchema {
  home: {
    title: string;
    placeholder: string;
    button: string;
    footer_left: string;
    footer_right: string;
  };
  reading: {
    loading: string;
    error: string;
    new_reading: string;
    labels: {
      mente: string;
      pasado: string;
      presente: string;
      futuro: string;
      raices: string;
    };
  };
  cards: Record<string, {
    name: string;
    info: string;
  }>;
}