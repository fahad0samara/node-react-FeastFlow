export interface MenuItem {
  _id: string;
  id: string;
  isNew: boolean;
  image: string;
  name: string;
  category: {
    name: string;
  };
  description: string;
  price: number;
}

export interface Category {
  _id: null | undefined;
  id: number;
  name: string;
}
