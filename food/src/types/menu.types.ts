export interface Ingredient {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  allergens: string[];
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  price: number;
  unit: string;
  defaultAmount: number;
  maxAmount: number;
  minAmount: number;
  image?: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  allergens: string[];
}

export interface DietaryInfo {
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isHalal?: boolean;
  isKosher?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;
}

export interface CustomizationOption {
  id: string;
  name: string;
  ingredients: Ingredient[];
  maxSelections: number;
  minSelections: number;
  priceAdjustment: number;
}

export interface ComboItem {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
  price: number;
  discount: number;
  maxItems: number;
  minItems: number;
}

export interface DietaryFilter {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isHalal: boolean;
  isKosher: boolean;
  allergens: string[];
  spicyLevel: number;
}

export interface MenuFilter {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  dietary: DietaryFilter;
  searchQuery: string;
  sortBy: 'price_asc' | 'price_desc' | 'rating' | 'popularity';
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image?: string;
  ingredients: Ingredient[];
  nutritionalInfo: NutritionalInfo;
  dietaryInfo: DietaryInfo;
  customizationOptions: CustomizationOption[];
  category: string;
  isAvailable: boolean;
  preparationTime: number;
  spicyLevel?: number;
  popularity?: number;
  tags: string[];
}

export interface CustomizedMenuItem extends MenuItem {
  selectedCustomizations: {
    optionId: string;
    selections: string[];
  }[];
  finalPrice: number;
}
