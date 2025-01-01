import React from 'react'
import ReactDOM from 'react-dom/client'
import App from "./App.tsx";
import {Provider} from "react-redux";
import {PersistGate} from "redux-persist/integration/react";
import {BrowserRouter} from "react-router-dom";
import {store, persistor} from "./Redux/store";
import { GoogleOAuthProvider } from '@react-oauth/google';

import "./index.css";
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <App />
          </GoogleOAuthProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
