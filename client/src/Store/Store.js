import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../Features/UserSlice";
import digitalRequestsReducer from "../Features/DigitalRequestSlice";
import adminReducer from "../Features/AdminSlice";
import notificationReducer from "../Features/NotificationSlice";

export const store = configureStore({
  reducer: {
    users: userReducer,
    digitalRequests: digitalRequestsReducer,
    admin: adminReducer,
    notifications: notificationReducer,
  },
});
