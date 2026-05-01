import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../lib/api";

const initialState = {
  pendingApprovals: [],
  currentRequest: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

export const createPurchaseRequest = createAsyncThunk(
  "digitalRequests/create",
  async (requestData, thunkAPI) => {
    try {
      const response = await api.post("/purchaseRequests", requestData);
      const purchaseRequest = response.data;
      console.log("Created Purchase Request:", purchaseRequest);
      return purchaseRequest;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create purchase request";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const fetchPendingApprovals = createAsyncThunk(
  "digitalRequests/fetchPending",
  async (userId, thunkAPI) => {
    try {
      console.log("📡 Fetching pending approvals for user:", userId);
      const response = await api.get(`/requests/pending/${userId}`);
      console.log("✅ Pending approvals received:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Fetch pending approvals error:",
        error.response?.data || error.message,
      );
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch pending approvals";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const processApproval = createAsyncThunk(
  "digitalRequests/approve",
  async ({ requestId, requestType, approvalData }, thunkAPI) => {
    try {
      const endpointMap = {
        PurchaseRequest: "purchaseRequests",
        TransportRequest: "transportRequests",
        FoodRequest: "foodRequests",
        FundRequest: "fundRequests",
        MaintenanceRequest: "maintenanceRequests",
        PrintingRequest: "printingRequests",
        RiskReport: "riskReports",
      };
      const endpoint = endpointMap[requestType] || "purchaseRequests";
      const response = await api.post(
        `/${endpoint}/${requestId}/approve`,
        approvalData,
      );
      const updatedRequest = { ...response.data, requestId };
      console.log("Processed Approval:", updatedRequest);
      return updatedRequest;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to process approval";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const fetchRequestDetails = createAsyncThunk(
  "digitalRequests/fetchDetails",
  async ({ requestId, requestType }, thunkAPI) => {
    try {
      const endpointMap = {
        PurchaseRequest: "purchaseRequests",
        TransportRequest: "transportRequests",
        FoodRequest: "foodRequests",
        FundRequest: "fundRequests",
        MaintenanceRequest: "maintenanceRequests",
        PrintingRequest: "printingRequests",
        RiskReport: "riskReports",
      };
      const endpoint = endpointMap[requestType] || "purchaseRequests";
      const response = await api.get(`/${endpoint}/${requestId}`);
      const requestDetails = response.data;
      console.log("Fetched Request Details:", requestDetails);
      return requestDetails;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch request details";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const digitalRequestSlice = createSlice({
  name: "digitalRequests",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.message = "";
      state.isError = false;
      state.isSuccess = false;
    },
    clearCurrentRequest: (state) => {
      state.currentRequest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPurchaseRequest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(createPurchaseRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = action.payload.message;
      })
      .addCase(createPurchaseRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || "Failed to create purchase request";
      })
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.pendingApprovals = action.payload;
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch pending approvals";
      })
      .addCase(processApproval.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(processApproval.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message;
        // Remove approved request from pending list
        state.pendingApprovals = state.pendingApprovals.filter(
          (req) => req.requestId !== action.payload.requestId,
        );
      })
      .addCase(processApproval.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to process approval";
      })
      .addCase(fetchRequestDetails.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchRequestDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.currentRequest = action.payload.request;
      })
      .addCase(fetchRequestDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch request details";
      });
  },
});

export const { clearMessages, clearCurrentRequest } =
  digitalRequestSlice.actions;
export default digitalRequestSlice.reducer;
