import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { login, register, fetchUserData, logout } from "./authThunks";
import { AuthState } from "../../types/auth.types";

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isAdmin: false,
  userId: null,
};

// Google login action
export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (credential: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/auth/google`,
        { credential }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || "Google login failed";
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearUserData: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.userId = null;
      localStorage.removeItem("token");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed";
      })

      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })

      // Google Login
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Google login failed";
      })

      // Fetch User Data
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch user data";
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      });
  },
});

export const { clearUserData, clearError } = authSlice.actions;
export default authSlice.reducer;
