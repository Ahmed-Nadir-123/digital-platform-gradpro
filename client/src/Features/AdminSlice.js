import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../lib/api";

export const ROLES = [
  "admin",
  "staff",
  "hod",
  "it_hod",
  "head_academic",
  "avc",
  "dean",
  "finance",
  "public_relations",
  "it_staff",
  "print_officer",
  "safety_officer",
];

const initialState = {
  stats: null,
  users: [],
  requests: [],
  workflows: [],
  roles: [],
  departments: [],
  isStatsLoading: false,
  isUsersLoading: false,
  isRequestsLoading: false,
  isWorkflowsLoading: false,
  isRolesLoading: false,
  isDepartmentsLoading: false,
  message: "",
};

export const fetchAdminStats = createAsyncThunk(
  "admin/fetchStats",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/admin/stats");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load stats",
      );
    }
  },
);

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/admin/users");
      return data.users || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load users",
      );
    }
  },
);

export const fetchAdminRequests = createAsyncThunk(
  "admin/fetchRequests",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/admin/requests");
      return data.requests || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load requests",
      );
    }
  },
);

export const fetchAdminWorkflows = createAsyncThunk(
  "admin/fetchWorkflows",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/admin/workflow-settings");
      return data.workflows || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load workflows",
      );
    }
  },
);

export const saveAdminWorkflow = createAsyncThunk(
  "admin/saveWorkflow",
  async ({ workflowId, config }, thunkAPI) => {
    try {
      const { data } = workflowId
        ? await api.put(`/admin/workflow-settings/${workflowId}`, config)
        : await api.post("/admin/workflow-settings", config);
      return data.workflow;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to save workflow",
      );
    }
  },
);

export const createAdminUser = createAsyncThunk(
  "admin/createUser",
  async (formData, thunkAPI) => {
    try {
      const { data } = await api.post("/admin/users", formData);
      return data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create user",
      );
    }
  },
);

export const updateAdminUser = createAsyncThunk(
  "admin/updateUser",
  async ({ userId, formData }, thunkAPI) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}`, formData);
      return data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update user",
      );
    }
  },
);

export const uploadAdminUserPhoto = createAsyncThunk(
  "admin/uploadUserPhoto",
  async ({ userId, file }, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const { data } = await api.post(`/upload/profile/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to upload photo",
      );
    }
  },
);

export const deleteAdminUser = createAsyncThunk(
  "admin/deleteUser",
  async (userId, thunkAPI) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      return userId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete user",
      );
    }
  },
);

export const fetchAdminRoles = createAsyncThunk(
  "admin/fetchRoles",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/admin/roles");
      return data.roles || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load roles",
      );
    }
  },
);

export const createAdminRole = createAsyncThunk(
  "admin/createRole",
  async ({ name, label }, thunkAPI) => {
    try {
      const { data } = await api.post("/admin/roles", { name, label });
      return data.role;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create role",
      );
    }
  },
);

export const fetchAdminDepartments = createAsyncThunk(
  "admin/fetchDepartments",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/admin/departments");
      return data.departments || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load departments",
      );
    }
  },
);

export const deleteAdminRole = createAsyncThunk(
  "admin/deleteRole",
  async (name, thunkAPI) => {
    try {
      await api.delete(`/admin/roles/${name}`);
      return name;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete role",
      );
    }
  },
);

export const deleteAdminRequest = createAsyncThunk(
  "admin/deleteRequest",
  async ({ requestId, requestType }, thunkAPI) => {
    try {
      await api.delete(`/admin/requests/${requestId}/${requestType}`);
      return { requestId, requestType };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete request",
      );
    }
  },
);

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminMessage: (state) => {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.isStatsLoading = true;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.isStatsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.isStatsLoading = false;
        state.message = action.payload || "Failed to load stats";
      })
      .addCase(fetchAdminUsers.pending, (state) => {
        state.isUsersLoading = true;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.isUsersLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.isUsersLoading = false;
        state.message = action.payload || "Failed to load users";
      })
      .addCase(fetchAdminRequests.pending, (state) => {
        state.isRequestsLoading = true;
      })
      .addCase(fetchAdminRequests.fulfilled, (state, action) => {
        state.isRequestsLoading = false;
        state.requests = action.payload;
      })
      .addCase(fetchAdminRequests.rejected, (state, action) => {
        state.isRequestsLoading = false;
        state.message = action.payload || "Failed to load requests";
      })
      .addCase(fetchAdminWorkflows.pending, (state) => {
        state.isWorkflowsLoading = true;
      })
      .addCase(fetchAdminWorkflows.fulfilled, (state, action) => {
        state.isWorkflowsLoading = false;
        state.workflows = action.payload;
      })
      .addCase(fetchAdminWorkflows.rejected, (state, action) => {
        state.isWorkflowsLoading = false;
        state.message = action.payload || "Failed to load workflows";
      })
      .addCase(saveAdminWorkflow.fulfilled, (state, action) => {
        const idx = state.workflows.findIndex(
          (workflow) => workflow._id === action.payload._id,
        );
        if (idx === -1) {
          state.workflows = [action.payload, ...state.workflows];
        } else {
          state.workflows = state.workflows.map((workflow) =>
            workflow._id === action.payload._id ? action.payload : workflow,
          );
        }
      })
      .addCase(createAdminUser.fulfilled, (state, action) => {
        state.users = [action.payload, ...state.users];
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        state.users = state.users.map((user) =>
          user._id === action.payload._id ? action.payload : user,
        );
      })
      .addCase(uploadAdminUserPhoto.fulfilled, (state, action) => {
        state.users = state.users.map((user) =>
          user._id === action.payload._id ? action.payload : user,
        );
      })
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.users = state.users.filter((user) => user._id !== action.payload);
      })
      .addCase(deleteAdminRequest.fulfilled, (state, action) => {
        state.requests = state.requests.filter(
          (request) => request.requestId !== action.payload.requestId,
        );
      })
      .addCase(fetchAdminRoles.pending, (state) => {
        state.isRolesLoading = true;
      })
      .addCase(fetchAdminRoles.fulfilled, (state, action) => {
        state.isRolesLoading = false;
        state.roles = action.payload;
      })
      .addCase(fetchAdminRoles.rejected, (state, action) => {
        state.isRolesLoading = false;
        state.message = action.payload || "Failed to load roles";
      })
      .addCase(createAdminRole.fulfilled, (state, action) => {
        state.roles = [...state.roles, action.payload];
      })
      .addCase(deleteAdminRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter((r) => r.name !== action.payload);
      })
      .addCase(fetchAdminDepartments.pending, (state) => {
        state.isDepartmentsLoading = true;
      })
      .addCase(fetchAdminDepartments.fulfilled, (state, action) => {
        state.isDepartmentsLoading = false;
        state.departments = action.payload;
      })
      .addCase(fetchAdminDepartments.rejected, (state) => {
        state.isDepartmentsLoading = false;
      });
  },
});

export const { clearAdminMessage } = adminSlice.actions;
export default adminSlice.reducer;