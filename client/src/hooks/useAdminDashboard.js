import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  createAdminUser,
  deleteAdminRequest,
  deleteAdminUser,
  fetchAdminRequests,
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminWorkflows,
  saveAdminWorkflow,
  updateAdminUser,
  uploadAdminUserPhoto,
  fetchAdminRoles,
  createAdminRole,
  deleteAdminRole,
  fetchAdminDepartments,
} from "../Features/AdminSlice";

// ─── Constants ────────────────────────────────────────────────────────────────
export const EMPTY_USER_FORM = {
  staffId: "",
  fullName: "",
  personal_name: "",
  initials: "",
  email: "",
  password: "",
  mobileNumber: "",
  mobile_number: "",
  departmentRef: "",
  office: "",
  officeContactNumber: "",
  office_contact_number: "",
  nationalId: "",
  national_id: "",
  manpowerId: "",
  manpower_id: "",
  academicQualification: "",
  academic_qualification: "",
  countryOfIssue: "",
  country_of_issue: "",
  yearOfIssue: "",
  year_of_issue: "",
  specialization: "",
  photoUrl: "",
  roles: [],
  role: "employee",
  isActive: true,
};

// ─── Pure validation (O – open for extension, easy to unit-test) ─────────────
export function validateUserForm(formData, isEdit) {
  const errors = {};
  if (!formData.staffId.trim()) errors.staffId = "errRequired";
  if (!formData.fullName.trim()) errors.fullName = "errRequired";
  if (!formData.email.trim()) {
    errors.email = "errRequired";
  } else if (!/@utas\.edu\.om$/i.test(formData.email.trim())) {
    errors.email = "errInvalidEmail";
  }
  if (!isEdit && !formData.password.trim()) errors.password = "errPassRequired";
  if (formData.password && formData.password.length < 6)
    errors.password = "errPassShort";
  return errors;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAdminDashboard() {
  const dispatch = useDispatch();
  const {
    stats,
    users,
    requests,
    workflows,
    roles,
    departments,
    isStatsLoading: statsLoading,
    isUsersLoading: usersLoading,
    isRequestsLoading: requestsLoading,
    isWorkflowsLoading,
    isRolesLoading: rolesLoading,
  } = useSelector((state) => state.admin);

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("overview");
  // ── Users ──────────────────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState("");
  const [updatingUser, setUpdatingUser] = useState(null);

  // ── User form modal ────────────────────────────────────────────────────────
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_USER_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formSaving, setFormSaving] = useState(false);

  // ── Requests ───────────────────────────────────────────────────────────────
  const [selectedRequest, setSelectedRequest] = useState(null);

  // ── Workflows ─────────────────────────────────────────────────────────────
  const [workflowModal, setWorkflowModal] = useState({
    open: false,
    requestType: null,
    config: null,
  });

  // ── Data fetchers ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(() => dispatch(fetchAdminStats()), [dispatch]);
  const fetchUsers = useCallback(() => dispatch(fetchAdminUsers()), [dispatch]);
  const fetchRequests = useCallback(() => dispatch(fetchAdminRequests()), [dispatch]);
  const fetchWorkflows = useCallback(() => dispatch(fetchAdminWorkflows()), [dispatch]);
  const fetchRoles = useCallback(() => dispatch(fetchAdminRoles()), [dispatch]);
  const fetchDepartments = useCallback(() => dispatch(fetchAdminDepartments()), [dispatch]);

  const addRole = async (name, label) => {
    try {
      await dispatch(createAdminRole({ name, label })).unwrap();
      toast.success("Role added");
    } catch (err) {
      toast.error(err || "Failed to add role");
    }
  };

  const deleteRole = async (name) => {
    try {
      await dispatch(deleteAdminRole(name)).unwrap();
      toast.success("Role deleted");
    } catch (err) {
      toast.error(err || "Failed to delete role");
    }
  };

  const saveWorkflow = async (requestType, config) => {
    try {
      const workflowId = config?._id || null;
      await dispatch(saveAdminWorkflow({ workflowId, config: { ...config, requestType } })).unwrap();
      toast.success("Workflow saved");
      return true;
    } catch (err) {
      toast.error(err || "Failed to save workflow");
      return false;
    }
  };

  const openWorkflowModal = (requestType) => {
    const normalizedType = (requestType || "").toLowerCase();
    const config = workflows.find(
      (w) => (w.requestType || "").toLowerCase() === normalizedType,
    ) || {
      requestType,
      workflowName: "",
      approvalLevels: [],
    };
    setWorkflowModal({ open: true, requestType, config });
  };

  const closeWorkflowModal = () =>
    setWorkflowModal({ open: false, requestType: null, config: null });

  useEffect(() => {
    fetchStats();
    fetchRequests();
  }, [fetchStats, fetchRequests]);

  useEffect(() => {
    if (activeTab === "users") { fetchUsers(); fetchRoles(); fetchDepartments(); }
    if (activeTab === "requests") fetchRequests();
    if (activeTab === "workflow") {
      fetchWorkflows();
      fetchUsers();
    }
    if (activeTab === "roles") {
      fetchRoles();
      fetchUsers();
    }
  }, [activeTab, fetchUsers, fetchRequests, fetchWorkflows, fetchRoles, fetchDepartments]);

  // ── Inline quick-update (role dropdown / active toggle) ───────────────────
  const updateUserInline = async (userId, patch) => {
    setUpdatingUser(userId);
    try {
      await dispatch(updateAdminUser({ userId, formData: patch })).unwrap();
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
      fullName: u.fullName || u.personal_name || "",
      personal_name: u.personal_name || u.fullName || "",
      initials: u.initials || "",
      email: u.email || "",
      password: "",
      mobileNumber: u.mobileNumber || u.mobile_number || "",
      mobile_number: u.mobile_number || u.mobileNumber || "",
      departmentRef: u.departmentRef?._id || u.departmentRef || "",
      office: u.office || "",
      officeContactNumber: u.officeContactNumber || u.office_contact_number || "",
      office_contact_number: u.office_contact_number || u.officeContactNumber || "",
      nationalId: u.nationalId || u.national_id || "",
      national_id: u.national_id || u.nationalId || "",
      manpowerId: u.manpowerId || u.manpower_id || "",
      manpower_id: u.manpower_id || u.manpowerId || "",
      academicQualification:
        u.academicQualification || u.academic_qualification || "",
      academic_qualification:
        u.academic_qualification || u.academicQualification || "",
      countryOfIssue: u.countryOfIssue || u.country_of_issue || "",
      country_of_issue: u.country_of_issue || u.countryOfIssue || "",
      yearOfIssue: u.yearOfIssue ?? u.year_of_issue ?? "",
      year_of_issue: u.year_of_issue ?? u.yearOfIssue ?? "",
      specialization: u.specialization || "",
      photoUrl: u.photoUrl || "",
      roles: Array.isArray(u.roles) ? u.roles : (u.roles ? u.roles.split(",").map(r => r.trim()).filter(Boolean) : (u.role ? [u.role] : [])),
      role: u.role || "employee",
      isActive: u.isActive !== false,
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
        await dispatch(
          updateAdminUser({ userId: editingUser._id, formData }),
        ).unwrap();
        toast.success("User updated successfully");
      } else {
        await dispatch(createAdminUser(formData)).unwrap();
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
    if (activeTab === "roles") fetchRoles();
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
      await dispatch(deleteAdminUser(userId)).unwrap();
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
      await dispatch(deleteAdminRequest({ requestId, requestType })).unwrap();
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
      u.fullName?.toLowerCase().includes(q) ||
      u.personal_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.staffId?.toLowerCase().includes(q) ||
      u.manpowerId?.toLowerCase().includes(q)
    );
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
    fetchRequests,
    selectedRequest,
    setSelectedRequest,
    // Inline update
    updateUserInline,
    deleteUser,
    deleteRequest,
    // Workflows
    workflows,
    workflowsLoading: isWorkflowsLoading,
    fetchWorkflows,
    saveWorkflow,
    workflowModal,
    openWorkflowModal,
    closeWorkflowModal,
    // Roles
    roles,
    rolesLoading,
    fetchRoles,
    addRole,
    deleteRole,
    // Departments
    departments,
    fetchDepartments,
    uploadUserPhoto: (userId, file) =>
      dispatch(uploadAdminUserPhoto({ userId, file })).unwrap(),
  };
}
