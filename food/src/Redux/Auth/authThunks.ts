import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { REGISTER_URL, LOGIN_URL, LOGOUT_URL, FETCH_USER_URL, GOOGLE_LOGIN_URL } from "../../urls";
import { 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse 
} from "../../types/auth.types";

// Register user
export const register = createAsyncThunk<
  AuthResponse,
  RegisterCredentials,
  { rejectValue: { message: string } }
>("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const response = await axios.post<AuthResponse>(REGISTER_URL, userData);
    
    // Store the JWT token
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Registration error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return rejectWithValue({
        message: error.response?.data?.message || "Registration failed"
      });
    }
    return rejectWithValue({ message: "An unexpected error occurred" });
  }
});

// Login user
export const login = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: { message: string } }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await axios.post<AuthResponse>(LOGIN_URL, credentials);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue({
        message: error.response?.data?.message || "Login failed"
      });
    }
    return rejectWithValue({ message: "An unexpected error occurred" });
  }
});

// Google login
export const googleLogin = createAsyncThunk<
  AuthResponse,
  { token: string },
  { rejectValue: { message: string } }
>("auth/googleLogin", async ({ token }, { rejectWithValue }) => {
  try {
    console.log('Sending Google login request with token:', token.substring(0, 10) + '...');
    const response = await axios.post<AuthResponse>(
      GOOGLE_LOGIN_URL,
      { token },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Google login response:', response.data);
    
    // Store the JWT token
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Google login error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return rejectWithValue({
        message: error.response?.data?.message || "Google login failed"
      });
    }
    return rejectWithValue({ message: "An unexpected error occurred" });
  }
});

// Fetch user data
export const fetchUserData = createAsyncThunk<
  User,
  void,
  { rejectValue: { message: string } }
>("auth/fetchUserData", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    const response = await axios.get<User>(FETCH_USER_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to fetch user data"
      });
    }
    return rejectWithValue({ message: "An unexpected error occurred" });
  }
});

// Logout user
export const logout = createAsyncThunk<
  void,
  void,
  { rejectValue: { message: string } }
>("auth/logout", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      await axios.post(LOGOUT_URL, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    localStorage.removeItem("token");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue({
        message: error.response?.data?.message || "Logout failed"
      });
    }
    return rejectWithValue({ message: "An unexpected error occurred" });
  }
});
