import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../lib/api";

const MULTI_LEVEL_TYPES = [
  "purchase", "PurchaseRequest",
  "transportation", "TransportRequest",
  "food", "FoodRequest",
  "fund", "FundRequest",
];

const REQUEST_TYPE_LABELS = {
  purchase: "PurchaseRequest",
  transportation: "TransportRequest",
  food: "FoodRequest",
  fund: "FundRequest",
  install_software: "InstallSoftwareRequest",
  printing: "PrintingRequest",
  risk_report: "RiskReport",
};

const REQUEST_TYPE_TO_ENDPOINT = {
  PurchaseRequest: "purchase",
  TransportRequest: "transportation",
  FoodRequest: "food",
  FundRequest: "fund",
  InstallSoftwareRequest: "install_software",
  PrintingRequest: "printing",
  RiskReport: "risk_report",
};

const TYPE_ENDPOINTS = {
  purchase: {
    create: "/purchase",
    user: "/purchase/user",
    pending: "/purchase/pending",
    details: "/purchase",
    approval: "/purchase",
  },
  transportation: {
    create: "/transportation",
    user: "/transportation/user",
    pending: "/transportation/pending",
    details: "/transportation",
    approval: "/transportation",
  },
  food: {
    create: "/food",
    user: "/food/user",
    pending: "/food/pending",
    details: "/food",
    approval: "/food",
  },
  fund: {
    create: "/fund",
    user: "/fund/user",
    pending: "/fund/pending",
    details: "/fund",
    approval: "/fund",
  },
  install_software: {
    create: "/install-software",
    user: "/install-software/user",
    assigned: "/install-software/assigned",
    details: "/install-software",
    approval: "/install-software",
  },
  printing: {
    create: "/printing",
    user: "/printing/user",
    assigned: "/printing/assigned",
    details: "/printing",
    approval: "/printing",
  },
  risk_report: {
    create: "/risk-reports",
    user: "/risk-reports/user",
    assigned: "/risk-reports/assigned",
    details: "/risk-reports",
    approval: "/risk-reports",
  },
};

const withType = (type, list) =>
  Array.isArray(list)
    ? list.map((item) => ({ ...item, requestType: REQUEST_TYPE_LABELS[type] || type }))
    : [];

const initialState = {
  pendingApprovals: [],
  myRequests: [],
  currentRequest: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

export const createPurchaseRequest = createAsyncThunk(
  "digitalRequests/createPurchase",
  async (requestData, thunkAPI) => {
    try {
      const response = await api.post(TYPE_ENDPOINTS.purchase.create, requestData);
      return response.data.request;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create purchase request";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const createTransportRequest = createAsyncThunk(
  "digitalRequests/createTransport",
  async (requestData, thunkAPI) => {
    try {
      const response = await api.post(
        TYPE_ENDPOINTS.transportation.create,
        requestData,
      );
      return response.data.request;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create transport request";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const createFoodRequest = createAsyncThunk(
  "digitalRequests/createFood",
  async (requestData, thunkAPI) => {
    try {
      const response = await api.post(TYPE_ENDPOINTS.food.create, requestData);
      return response.data.request;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create food request";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const createFundRequest = createAsyncThunk(
  "digitalRequests/createFund",
  async (requestData, thunkAPI) => {
    try {
      const response = await api.post(TYPE_ENDPOINTS.fund.create, requestData);
      return response.data.request;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create fund request";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const createInstallSoftwareRequest = createAsyncThunk(
  "digitalRequests/createInstallSoftware",
  async (requestData, thunkAPI) => {
    try {
      const response = await api.post(
        TYPE_ENDPOINTS.install_software.create,
        requestData,
      );
      return response.data.request;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create install software request";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const createPrintingRequest = createAsyncThunk(
  "digitalRequests/createPrinting",
  async (requestData, thunkAPI) => {
    try {
      const response = await api.post(TYPE_ENDPOINTS.printing.create, requestData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.request;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create printing request";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const createRiskRequest = createAsyncThunk(
  "digitalRequests/createRisk",
  async (requestData, thunkAPI) => {
    try {
      const response = await api.post(TYPE_ENDPOINTS.risk_report.create, requestData);
      return response.data.request;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create risk report";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const fetchMyRequests = createAsyncThunk(
  "digitalRequests/fetchMy",
  async (userId, thunkAPI) => {
    try {
      const entries = Object.entries(TYPE_ENDPOINTS);
      const results = await Promise.allSettled(
        entries.map(([_, cfg]) => api.get(`${cfg.user}/${userId}`)),
      );
      const combined = results.flatMap((result, index) => {
        if (result.status !== "fulfilled") return [];
        const [type] = entries[index];
        const list = result.value.data?.requests || [];
        return withType(type, list);
      });
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return combined;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch user requests";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  },
);

export const fetchPendingApprovals = createAsyncThunk(
  "digitalRequests/fetchPending",
  async (userId, thunkAPI) => {
    try {
      const entries = Object.entries(TYPE_ENDPOINTS);
      const results = await Promise.allSettled(
        entries.map(([type, cfg]) => {
          if (MULTI_LEVEL_TYPES.includes(type)) {
            return api.get(`${cfg.pending}/${userId}`);
          }
          return api.get(`${cfg.assigned}/${userId}`);
        }),
      );
      const combined = results.flatMap((result, index) => {
        if (result.status !== "fulfilled") return [];
        const [type] = entries[index];
        const list = result.value.data?.requests || [];
        return withType(type, list);
      });
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return combined;
    } catch (error) {
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
      const cfg = TYPE_ENDPOINTS[REQUEST_TYPE_TO_ENDPOINT[requestType] || requestType];
      if (!cfg) {
        return thunkAPI.rejectWithValue("Unknown request type");
      }
      let response;
      if (MULTI_LEVEL_TYPES.includes(requestType)) {
        const { action, comments } = approvalData;
        response = await api.put(`${cfg.approval}/${requestId}/status`, {
          action,
          comments,
        });
      } else {
        const { newStatus, notes } = approvalData;
        response = await api.put(`${cfg.approval}/${requestId}/status`, {
          newStatus,
          notes,
        });
      }
      return {
        request: response.data.request,
        requestId,
        requestType,
      };
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
      const cfg = TYPE_ENDPOINTS[REQUEST_TYPE_TO_ENDPOINT[requestType] || requestType];
      if (!cfg) {
        return thunkAPI.rejectWithValue("Unknown request type");
      }
      const response = await api.get(`${cfg.details}/${requestId}`);
      return { request: response.data.request, requestType };
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
      .addCase(createPurchaseRequest.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Request submitted.";
      })
      .addCase(createPurchaseRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || "Failed to create purchase request";
      })
      .addCase(createTransportRequest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(createTransportRequest.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Request submitted.";
      })
      .addCase(createTransportRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || "Failed to create transport request";
      })
      .addCase(createFoodRequest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(createFoodRequest.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Request submitted.";
      })
      .addCase(createFoodRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || "Failed to create food request";
      })
      .addCase(createFundRequest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(createFundRequest.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Request submitted.";
      })
      .addCase(createFundRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || "Failed to create fund request";
      })
      .addCase(createInstallSoftwareRequest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(createInstallSoftwareRequest.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Request submitted.";
      })
      .addCase(createInstallSoftwareRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message =
          action.payload || "Failed to create install software request";
      })
      .addCase(createPrintingRequest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(createPrintingRequest.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Request submitted.";
      })
      .addCase(createPrintingRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || "Failed to create printing request";
      })
      .addCase(createRiskRequest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(createRiskRequest.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Request submitted.";
      })
      .addCase(createRiskRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || "Failed to create risk report";
      })
      .addCase(fetchMyRequests.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.myRequests = action.payload || [];
      })
      .addCase(fetchMyRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch user requests";
      })
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.pendingApprovals = action.payload || [];
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
        state.message = "Request updated.";
        state.pendingApprovals = state.pendingApprovals.filter(
          (request) =>
            request.requestId !== action.payload.requestId &&
            request.requestNumber !== action.payload.requestId,
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
        state.currentRequest = action.payload.request;
      })
      .addCase(fetchRequestDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch request details";
      });
  },
});

export const { clearMessages, clearCurrentRequest } = digitalRequestSlice.actions;
export default digitalRequestSlice.reducer;
