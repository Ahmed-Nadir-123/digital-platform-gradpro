import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../lib/api";

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  message: "",
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (userId, thunkAPI) => {
    try {
      const { data } = await api.get(`/notifications/${userId}`);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load notifications",
      );
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (notificationId, thunkAPI) => {
    try {
      const { data } = await api.put(`/notifications/${notificationId}/read`);
      return data.notification;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update notification",
      );
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (userId, thunkAPI) => {
    try {
      await api.put(`/notifications/read-all/${userId}`);
      return userId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update notifications",
      );
    }
  },
);

export const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotificationMessage: (state) => {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications || [];
        state.unreadCount = action.payload.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.notifications = [];
        state.unreadCount = 0;
        state.message = action.payload || "Failed to load notifications";
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.notifications = state.notifications.map((notification) =>
          notification._id === action.payload._id
            ? { ...notification, isRead: true }
            : notification,
        );
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        }));
        state.unreadCount = 0;
      });
  },
});

export const { clearNotificationMessage } = notificationSlice.actions;
export default notificationSlice.reducer;