import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
export const ROLES = ["admin", "IT Staff", "employee"];

export const EMPTY_USER_FORM = {
  staffId: "",
  personal_name: "",
  initials: "",
  email: "",
  password: "",
  mobile_number: "",
  department: "",
  office: "",
  office_contact_number: "",
  national_id: "",
  manpower_id: "",
  gender: "",
  nationality: "",
  academic_qualification: "",
  year_of_issue: "",
  specialization: "",
  name_of_university: "",
  country_of_issue: "",
  role: "employee",
  isActive: true,
};

// ─── Pure validation (O – open for extension, easy to unit-test) ─────────────
export function validateUserForm(formData, isEdit) {
  const errors = {};
  if (!formData.staffId.trim()) errors.staffId = "errRequired";
  if (!formData.personal_name.trim()) errors.personal_name = "errRequired";
  if (!formData.email.trim()) {
    errors.email = "errRequired";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "errInvalidEmail";
  }
  if (!isEdit && !formData.password.trim()) errors.password = "errPassRequired";
  if (formData.password && formData.password.length < 6)
    errors.password = "errPassShort";
  return errors;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAdminDashboard() {
  // ── Tab ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("overview");

  // ── Stats ──────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Users ──────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [updatingUser, setUpdatingUser] = useState(null);

  // ── User form modal ────────────────────────────────────────────────────────
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_USER_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formSaving, setFormSaving] = useState(false);

  // ── Requests ───────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  // ── Workflows ─────────────────────────────────────────────────────────────
  const [workflows, setWorkflows] = useState([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [workflowModal, setWorkflowModal] = useState({
    open: false,
    requestType: null,
    config: null,
  });

  // ── Data fetchers ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data.users || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const { data } = await api.get("/admin/requests");
      setRequests(data.requests || []);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const fetchWorkflows = useCallback(async () => {
    setWorkflowsLoading(true);
    try {
      const { data } = await api.get("/admin/workflows");
      setWorkflows(data.workflows || []);
    } catch {
      toast.error("Failed to load workflows");
    } finally {
      setWorkflowsLoading(false);
    }
  }, []);

  const saveWorkflow = async (requestType, config) => {
    try {
      const { data } = await api.put(`/admin/workflows/${requestType}`, config);
      setWorkflows((prev) =>
        prev.map((w) => (w.type === requestType ? data.workflow : w)),
      );
      toast.success("Workflow saved");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save workflow");
      return false;
    }
  };

  const openWorkflowModal = (requestType) => {
    const config = workflows.find((w) => w.type === requestType) || {
      type: requestType,
      workflowType: "chain",
      steps: [],
      handlerGroup: [],
    };
    setWorkflowModal({ open: true, requestType, config });
  };

  const closeWorkflowModal = () =>
    setWorkflowModal({ open: false, requestType: null, config: null });

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "requests") fetchRequests();
    if (activeTab === "workflow") {
      fetchWorkflows();
      fetchUsers();
    }
  }, [activeTab, fetchUsers, fetchRequests, fetchWorkflows]);

  // ── Inline quick-update (role dropdown / active toggle) ───────────────────
  const updateUserInline = async (userId, patch) => {
    setUpdatingUser(userId);
    try {
      const { data } = await api.patch(`/admin/users/${userId}`, patch);
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
      toast.success("Updated");
      fetchStats();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setUpdatingUser(null);
    }
  };

  // ── User form actions ──────────────────────────────────────────────────────
  const openCreateForm = () => {
    setEditingUser(null);
    setFormData(EMPTY_USER_FORM);
    setFormErrors({});
    setUserFormOpen(true);
  };

  const openEditForm = (u) => {
    setEditingUser(u);
    setFormData({
      staffId: u.staffId || "",
      personal_name: u.personal_name || "",
      initials: u.initials || "",
      email: u.email || "",
      password: "",
      mobile_number: u.mobile_number || "",
      department: u.department || "",
      office: u.office || "",
      office_contact_number: u.office_contact_number || "",
      national_id: u.national_id || "",
      manpower_id: u.manpower_id || "",
      gender: u.gender || "",
      nationality: u.nationality || "",
      academic_qualification: u.academic_qualification || "",
      year_of_issue: u.year_of_issue ?? "",
      specialization: u.specialization || "",
      name_of_university: u.name_of_university || "",
      country_of_issue: u.country_of_issue || "",
      role: u.role || "employee",
      isActive: u.isActive !== false,
      photoUrl: u.photoUrl || "",
    });
    setFormErrors({});
    setUserFormOpen(true);
  };

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key])
      setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = validateUserForm(formData, !!editingUser);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormSaving(true);
    try {
      if (editingUser) {
        const { data } = await api.put(
          `/admin/users/${editingUser._id}`,
          formData,
        );
        setUsers((prev) =>
          prev.map((u) => (u._id === editingUser._id ? data.user : u)),
        );
        toast.success("User updated successfully");
      } else {
        const { data } = await api.post("/admin/users", formData);
        setUsers((prev) => [data.user, ...prev]);
        toast.success("User created successfully");
      }
      setUserFormOpen(false);
      fetchStats();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (editingUser ? "Failed to update user" : "Failed to create user"),
      );
    } finally {
      setFormSaving(false);
    }
  };

  // ── Refresh all ───────────────────────────────────────────────────────────
  const refreshAll = () => {
    fetchStats();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "requests") fetchRequests();
    if (activeTab === "workflow") fetchWorkflows();
  };

  // ── Delete user ───────────────────────────────────────────────────────────
  const deleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success("User deleted");
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  // ── Delete request ────────────────────────────────────────────────────────
  const deleteRequest = async (requestId, requestType) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this request? This cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/admin/requests/${requestId}/${requestType}`);
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      toast.success("Request deleted");
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete request");
    }
  };

  // ── Derived / filtered lists ───────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.personal_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.staffId?.toLowerCase().includes(q)
    );
  });

  const filteredRequests = requests.filter((r) => {
    const q = requestSearch.toLowerCase();
    const matchSearch =
      r.requestId?.toLowerCase().includes(q) ||
      r.itemName?.toLowerCase().includes(q) ||
      r.destination?.toLowerCase().includes(q) ||
      r.occasionName?.toLowerCase().includes(q) ||
      r.purposeTitle?.toLowerCase().includes(q) ||
      r.requesterId?.personal_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return {
    // Tab
    activeTab,
    setActiveTab,
    // Stats
    stats,
    statsLoading,
    fetchStats,
    refreshAll,
    // Users
    users,
    usersLoading,
    userSearch,
    setUserSearch,
    updatingUser,
    fetchUsers,
    filteredUsers,
    // User form
    userFormOpen,
    setUserFormOpen,
    editingUser,
    formData,
    formErrors,
    formSaving,
    openCreateForm,
    openEditForm,
    setField,
    handleFormSubmit,
    // Requests
    requests,
    requestsLoading,
    requestSearch,
    setRequestSearch,
    fetchRequests,
    filteredRequests,
    selectedRequest,
    setSelectedRequest,
    statusFilter,
    setStatusFilter,
    // Inline update
    updateUserInline,
    deleteUser,
    deleteRequest,
    // Workflows
    workflows,
    workflowsLoading,
    fetchWorkflows,
    saveWorkflow,
    workflowModal,
    openWorkflowModal,
    closeWorkflowModal,
  };
}
