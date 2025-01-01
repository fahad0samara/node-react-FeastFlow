// Base URLs
export const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:5000';
export const BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
export const API_URL = `${BASE_URL}/api`;

// Authentication URLs
export const LOGIN_URL = `${API_URL}/auth/login`;
export const REGISTER_URL = `${API_URL}/auth/register`;
export const LOGOUT_URL = `${API_URL}/auth/logout`;
export const GOOGLE_LOGIN_URL = `${API_URL}/auth/google`;
export const FETCH_USER_URL = `${API_URL}/auth/me`;

// Cart URLs
export const ADD_TO_CART_URL = `${API_URL}/cart/add`;
export const FETCH_CART_URL = (userId: string) =>
  `${API_URL}/cart/cart/${userId}`;
export const REMOVE_ITEM_FROM_CART_URL = (userId: string, itemId: string) =>
  `${API_URL}/cart/delete/${userId}/${itemId}`;
export const CLEAR_CART_URL = (userId: string) =>
  `${API_URL}/cart/clear/${userId}`;
export const UPDATE_CART_ITEM_QUANTITY_URL = (userId: string, itemId: string) =>
  `${API_URL}/cart/updateQuantity/${userId}/${itemId}`;

// Menu and Category URLs
export const FETCH_CATEGORIES_URL = `${API_URL}/category`;
export const ADD_MENU_URL = `${API_URL}/menu`;
export const FETCH_MENU_URL = `${API_URL}/menu/user`;
export const FETCH_MENU_BY_CATEGORY_URL = (categoryId: string) =>
  `${API_URL}/menu/${categoryId}`;

// Menu and Recipe Builder URLs
export const FETCH_INGREDIENTS_URL = `${API_URL}/ingredients`;
export const FETCH_INGREDIENT_BY_ID_URL = (id: string) => `${API_URL}/ingredients/${id}`;
export const SAVE_RECIPE_URL = `${API_URL}/recipes`;
export const FETCH_RECIPES_URL = `${API_URL}/recipes`;
export const FETCH_RECIPE_BY_ID_URL = (id: string) => `${API_URL}/recipes/${id}`;
export const UPDATE_RECIPE_URL = (id: string) => `${API_URL}/recipes/${id}`;
export const DELETE_RECIPE_URL = (id: string) => `${API_URL}/recipes/${id}`;

// Dietary and Nutritional URLs
export const FETCH_DIETARY_INFO_URL = `${API_URL}/dietary`;
export const FETCH_NUTRITIONAL_INFO_URL = `${API_URL}/nutritional`;
export const FETCH_ALLERGENS_URL = `${API_URL}/allergens`;

// User Management URLs
export const FETCH_USERS_AND_ADMINS_URL = (currentPage: number, filterBy: string) =>
  `${API_URL}/auth/users-admins?page=${currentPage}&filterBy=${filterBy}`;
export const MAKE_ADMIN_URL = (userId: string) =>
  `${API_URL}/auth/make-admin/${userId}`;
export const DELETE_USER_URL = (userId: string) =>
  `${API_URL}/auth/users/${userId}`;
export const DELETE_ADMIN_URL = (adminId: string) =>
  `${API_URL}/auth/admins/${adminId}`;

// Menu Management URLs
export const FETCH_MENU_ITEMS_URL = (
  page: number,
  itemsPerPage: number,
  searchQuery: string,
  sortColumn: string,
  sortDirection: string
) =>
  `${API_URL}/menu?page=${page}&limit=${itemsPerPage}&search=${searchQuery}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;

export const DELETE_CATEGORY_URL = (deletingCatId: string) =>
  `${API_URL}/menu/${deletingCatId}`;

export const ADD_CATEGORY_URL = `${API_URL}/category`;

export const DELETE_MENU_ITEM_URL = (itemId: string) =>
  `${API_URL}/menu/${itemId}`;

// Order URLs
export const FETCH_RECENT_ORDERS_URL = `${API_URL}/orders/recent-orders`;
export const FETCH_MOST_ORDERED_ITEMS_URL = `${API_URL}/orders/most-ordered-items`;
export const FETCH_ORDERS_URL = `${API_URL}/orders`;
export const ADD_ORDER_URL = `${API_URL}/orders`;
export const UPDATE_ORDER_URL = (id: string) => `${API_URL}/orders/${id}`;
export const DELETE_ORDER_URL = (id: string) => `${API_URL}/orders/${id}`;

// Cloudinary Image URLs
export const CLOUDINARY_BASE_URL = `${API_URL}/cloudinary`;
export const CLOUDINARY_UPLOAD_URL = `${CLOUDINARY_BASE_URL}/upload`;
export const CLOUDINARY_BULK_UPLOAD_URL = `${CLOUDINARY_BASE_URL}/bulk-upload`;
export const CLOUDINARY_DELETE_IMAGE_URL = (publicId: string) =>
  `${CLOUDINARY_BASE_URL}/delete/${publicId}`;
export const CLOUDINARY_OPTIMIZE_IMAGE_URL = (publicId: string) =>
  `${CLOUDINARY_BASE_URL}/optimize/${publicId}`;
export const CLOUDINARY_RESTORE_IMAGE_URL = (publicId: string) =>
  `${CLOUDINARY_BASE_URL}/restore/${publicId}`;
export const CLOUDINARY_IMAGE_INFO_URL = (publicId: string) =>
  `${CLOUDINARY_BASE_URL}/info/${publicId}`;
export const CLOUDINARY_LIST_IMAGES_URL = `${CLOUDINARY_BASE_URL}/list`;
export const CLOUDINARY_SEARCH_BY_TAGS_URL = `${CLOUDINARY_BASE_URL}/search`;
export const CLOUDINARY_TRANSFORM_IMAGE_URL = (publicId: string) =>
  `${CLOUDINARY_BASE_URL}/transform/${publicId}`;
export const CLOUDINARY_ADD_TAG_URL = (publicId: string) =>
  `${CLOUDINARY_BASE_URL}/tag/${publicId}`;
export const CLOUDINARY_REMOVE_TAG_URL = (publicId: string) =>
  `${CLOUDINARY_BASE_URL}/untag/${publicId}`;

// User URLs
export const FETCH_USERS_URL = `${API_URL}/users`;
export const ADD_USER_URL = `${API_URL}/users`;
export const UPDATE_USER_URL = (id: string) => `${API_URL}/users/${id}`;

// Profile URLs
export const FETCH_PROFILE_URL = `${API_URL}/profile`;
export const UPDATE_PROFILE_URL = `${API_URL}/profile`;
export const CHANGE_PASSWORD_URL = `${API_URL}/profile/password`;
