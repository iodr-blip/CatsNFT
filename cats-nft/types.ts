
export interface StickerItem {
  id: number;
  name: string;
  price: number;
  tgs: string;
  color: string;
  boughtAt?: number;
}

export type PageType = 'shop' | 'pvp' | 'solo' | 'profile';

export interface UserState {
  balance: number;
  inventory: StickerItem[];
  username: string;
  photo_url?: string;
}
