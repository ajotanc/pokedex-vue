export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface AnimatedSprites {
  front_default: string;
}

export interface GenerationSprites {
  'black-white'?: {
    animated?: AnimatedSprites;
    front_default?: string;
  };
}

export interface PokemonSprites {
  front_default: string;
  other: {
    'official-artwork': {
      front_default: string;
    };
  };
  versions?: {
    'generation-v'?: GenerationSprites;
  };
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: PokemonType[];
  sprites: PokemonSprites;
}