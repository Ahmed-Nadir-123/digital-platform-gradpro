import React from "react";
import { Button } from "../ui/button";
import {
  Users,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import { useLanguage } from "../../lib/LanguageContext";
import { ADMIN_T } from "./adminTranslations";
import { StatCard, TabButton } from "./adminHelpers";
import { OverviewTab } from "./OverviewTab";
import { UsersTab, UserFormModal } from "./UsersTab";
import { RequestsTab, RequestDetailsModal } from "./RequestsTab";

// ─── AdminDashboard — main orchestrator (S: coordinates sub-components) ───
const AdminDashboard = () => {
  const dash = useAdminDashboard();
  const { lang } = useLanguage();
  const t = (k) => ADMIN_T[lang][k];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("subtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={dash.refreshAll}>
          <RefreshCw className="h-3.5 w-3.5 me-1.5" />
          {t("refresh")}
        </Button>
      </div>

      {/* Stats */}
      {dash.statsLoading ? (
        <div className="flex items-center gap-2 py-6 text-muted-foreground justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("loadingStats")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label={t("totalUsers")}
            value={dash.stats?.totalUsers ?? 0}
            color="text-primary"
            bg="bg-primary/10"
            border="border-primary/15"
          />
          <StatCard
            icon={<ClipboardList className="h-5 w-5" />}
            label={t("totalRequests")}
            value={dash.stats?.totalRequests ?? 0}
            color="text-slate-600"
            bg="bg-slate-100"
            border="border-slate-200"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label={t("pending")}
            value={dash.stats?.pendingRequests ?? 0}
            color="text-amber-600"
            bg="bg-amber-50"
            border="border-amber-200"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label={t("approved")}
            value={dash.stats?.approvedRequests ?? 0}
            color="text-green-600"
            bg="bg-green-50"
            border="border-green-200"
          />
          <StatCard
            icon={<XCircle className="h-5 w-5" />}
            label={t("rejected")}
            value={dash.stats?.rejectedRequests ?? 0}
            color="text-red-500"
            bg="bg-red-50"
            border="border-red-200"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 flex-wrap">
        <TabButton
          id="overview"
          label={t("tabOverview")}
          icon={<ShieldCheck className="h-4 w-4" />}
          activeTab={dash.activeTab}
          onClick={dash.setActiveTab}
        />
        <TabButton
          id="users"
          label={t("tabUsers")}
          icon={<Users className="h-4 w-4" />}
          activeTab={dash.activeTab}
          onClick={dash.setActiveTab}
        />
        <TabButton
          id="requests"
          label={t("tabRequests")}
          icon={<ClipboardList className="h-4 w-4" />}
          activeTab={dash.activeTab}
          onClick={dash.setActiveTab}
        />
      </div>

      {/* Tab content */}
      {dash.activeTab === "overview" && (
        <OverviewTab
          stats={dash.stats}
          onGoToUsers={() => dash.setActiveTab("users")}
          onGoToRequests={() => dash.setActiveTab("requests")}
        />
      )}
      {dash.activeTab === "users" && (
        <UsersTab
          filteredUsers={dash.filteredUsers}
          usersLoading={dash.usersLoading}
          userSearch={dash.userSearch}
          setUserSearch={dash.setUserSearch}
          updatingUser={dash.updatingUser}
          updateUserInline={dash.updateUserInline}
          openCreateForm={dash.openCreateForm}
          openEditForm={dash.openEditForm}
          onDeleteUser={dash.deleteUser}
        />
      )}
      {dash.activeTab === "requests" && (
        <RequestsTab
          filteredRequests={dash.filteredRequests}
          requestsLoading={dash.requestsLoading}
          requestSearch={dash.requestSearch}
          setRequestSearch={dash.setRequestSearch}
          statusFilter={dash.statusFilter}
          setStatusFilter={dash.setStatusFilter}
          onViewRequest={dash.setSelectedRequest}
          onDeleteRequest={dash.deleteRequest}
        /> 
      )}

      {/* Modals */}
      <RequestDetailsModal
        request={dash.selectedRequest}
        onClose={() => dash.setSelectedRequest(null)}
      />
      <UserFormModal
        open={dash.userFormOpen}
        onOpenChange={dash.setUserFormOpen}
        editingUser={dash.editingUser}
        formData={dash.formData}
        formErrors={dash.formErrors}
        formSaving={dash.formSaving}
        setField={dash.setField}
        onSubmit={dash.handleFormSubmit}
      />
    </div>
  );
};

export default AdminDashboard;
