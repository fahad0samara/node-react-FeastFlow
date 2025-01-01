import { Document } from 'mongoose';

export interface Coordinates {
  latitude: number;
  longitude: number;
  coordinates?: [number, number]; // For MongoDB GeoJSON compatibility
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface TimeWindow {
  startTime: Date;
  endTime: Date;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: Pagination;
}

export interface BaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchFilters {
  query?: string;
  location?: Coordinates;
  radius?: number;
  priceRange?: PriceRange;
  cuisine?: string[];
  dietary?: string[];
  rating?: number;
  isOpen?: boolean;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}
