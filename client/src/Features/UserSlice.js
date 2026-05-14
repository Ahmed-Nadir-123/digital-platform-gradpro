import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../lib/api";

const savedUser = (() => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const savedToken = (() => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
})();

const initialState = {
  user: savedUser || {},
  token: savedToken || "",
  isLoading: false,
  isSuccess: !!savedUser && !!savedToken,
  isError: false,
  message: "",
};

export const login = createAsyncThunk(
  "users/login",
  async (userData, thunkAPI) => {
    try {
      const response = await api.post("/auth/login", {
        email: userData.email,
        password: userData.password,
      });

      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Invalid email or password";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const fetchUserProfile = createAsyncThunk(
  "users/fetchProfile",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/auth/me");
      return response.data.user || response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to load user profile";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const logout = createAsyncThunk("/users/logout", async () => true);

export const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    resetUser: (state) => {
      state.user = {};
      state.token = "";
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user || {};
        state.token = action.payload.token || "";
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Login successful.";
        localStorage.setItem("user", JSON.stringify(state.user));
        if (state.token) {
          localStorage.setItem("token", state.token);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.user = {};
        state.token = "";
        state.message = action.payload || "Invalid email or password";
      })
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.message = "";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = {};
        state.token = "";
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = false;
        state.message = "Logged out successfully.";
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Logout failed";
      });
  },
});

export const { setUser, resetUser } = userSlice.actions;
export default userSlice.reducer;
