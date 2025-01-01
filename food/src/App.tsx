import {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {fetchUserData, logout} from "./Redux/Auth/authThunks";
import {useNavigate} from "react-router-dom";
import Router from "./Router/Router";
import {ToastContainer} from "react-toastify";
import {AppDispatch, RootState} from "./Redux/store";
import DarkModeToggle from "./hook/DarkModeToggle";
import {useDarkMode} from "./hook/useDarkMode";
import Loder from "./Loder";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { GoogleOAuthProvider } from '@react-oauth/google';

const App = () => {
    const isDarkMode = useDarkMode();
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();

    const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
    );
    const token = useSelector((state: RootState) => state.auth.token);
    const loading = useSelector((state: RootState) => state.auth.loading);

 useEffect(() => {
   const initializeApp = async () => {
     if (isAuthenticated || token) {
       // If the user is already authenticated or a token exists in Redux state, fetch user data
       dispatch(fetchUserData());
     } else {
       // If the user is not authenticated and no token exists in Redux state, logout
       dispatch(logout());
       navigate("/Login");
     }
   };

   initializeApp();
 }, [dispatch, isAuthenticated, token]);

    if (loading) {
      return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <div
              className={`
          ${isDarkMode ? "bg-black text-white " : "bg-white text-black"}`}
              
            >
              <Loder/>
            </div>
          </ThemeProvider>
        </GoogleOAuthProvider>
      );
    }

    return (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div
            className={` ${
              isDarkMode ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            <DarkModeToggle />
            <ToastContainer />
            <Router />
          </div>
        </ThemeProvider>
      </GoogleOAuthProvider>
    );
};

export default App;
