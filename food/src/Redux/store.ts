import {
  configureStore,
  ThunkAction,
  Action,
  combineReducers,
} from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./Auth/authSlice";
import cartReducer from "./cart/cartSlice";
import darkModeReducer from "./Darkmode/darkModeSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "cart", "darkmode"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  darkmode: darkModeReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
