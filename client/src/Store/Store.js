import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../Features/UserSlice";
import digitalRequestsReducer from "../Features/DigitalRequestSlice";

export const store = configureStore({
  reducer: {
    users: userReducer,
    digitalRequests: digitalRequestsReducer,
  },
  devTools: false,
});
