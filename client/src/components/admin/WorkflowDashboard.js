import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  GitBranch,
  UsersRound,
  Settings2,
  Plus,
  Trash2,
  ShoppingCart,
  Truck,
  UtensilsCrossed,
  Wallet,
  Wrench,
  Printer,
  AlertTriangle,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Search,
  RotateCcw,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import { useLanguage } from "../../lib/LanguageContext";

// ─── Translations ─────────────────────────────────────────────────────────────
const WF_T = {
  en: {
    pageTitle: "Request Routing",
    pageSubtitle: "Define approval paths for each request type",
    refresh: "Refresh",
    statsTotal: "Request Types",
    statsConfigured: "Configured",
    statsPending: "Needs Setup",
    statsProgress: "Setup Progress",
    wfLoadingLabel: "Loading workflows…",
    wfNotConfigured: "Not Configured",
    wfChain: "Chain",
    wfGroup: "Group",
    wfSteps: "steps",
    wfHandlers: "handlers",
    wfConfigureBtn: "Configure",
    wfEditBtn: "Edit Flow",
    wfTypeNames: {
      PurchaseRequest: "Purchase Request",
      TransportRequest: "Transport Request",
      FoodRequest: "Food / Catering",
      FundRequest: "Fund Request",
      MaintenanceRequest: "Maintenance / IT Help",
      PrintingRequest: "Printing Request",
      RiskReport: "Risk Report",
    },
    wfModalTitle: "Configure Workflow",
    wfModalDesc: "Define the approval routing for this request type.",
    wfModeChain: "Sequential Chain",
    wfModeGroup: "Handler Pool",
    wfModeChainDesc: "Approvers in a fixed order, one after another.",
    wfModeGroupDesc: "Auto-assigned to one handler via round-robin.",
    wfChainStepsTitle: "Approval Steps",
    wfAddStep: "Add Approver",
    wfNoSteps: "No steps yet — add at least one approver to continue.",
    wfGroupTitle: "Handler Pool",
    wfGroupInfo: "Round-robin",
    wfAddHandler: "Add",
    wfNoHandlers: "No handlers yet — add at least one handler.",
    wfSelectUser: "Select user…",
    wfSearchUsers: "Search by name or role…",
    wfFlowPreview: "Live Preview",
    wfFlowStart: "New Request",
    wfFlowEnd: "Approved",
    wfGroupAssigned: "Auto-Assigned",
    wfMoveUp: "Move up",
    wfMoveDown: "Move down",
    wfSave: "Save Workflow",
    wfCancel: "Cancel",
    wfSaveSuccess: "Workflow saved successfully",
    wfSaveError: "Failed to save workflow",
    wfEmptyHint: "Click to configure the approval flow for this request type.",
    wfRoundRobinNote:
      "Requests are assigned to one handler at a time, cycling through the pool.",
  },
  ar: {
    pageTitle: "توجيه الطلبات",
    pageSubtitle: "حدد مسارات الموافقة لكل نوع من الطلبات",
    refresh: "تحديث",
    statsTotal: "أنواع الطلبات",
    statsConfigured: "مهيأ",
    statsPending: "يحتاج إعداد",
    statsProgress: "تقدم الإعداد",
    wfLoadingLabel: "جاري تحميل مسارات العمل…",
    wfNotConfigured: "غير مهيأ",
    wfChain: "سلسلة",
    wfGroup: "مجموعة",
    wfSteps: "خطوات",
    wfHandlers: "معالجين",
    wfConfigureBtn: "إعداد",
    wfEditBtn: "تعديل المسار",
    wfTypeNames: {
      PurchaseRequest: "طلب شراء",
      TransportRequest: "طلب نقل",
      FoodRequest: "طلب طعام / تقديم",
      FundRequest: "طلب تمويل",
      MaintenanceRequest: "صيانة / دعم تقني",
      PrintingRequest: "طلب طباعة",
      RiskReport: "تقرير مخاطر",
    },
    wfModalTitle: "إعداد مسار العمل",
    wfModalDesc: "حدد مسار الموافقة لهذا النوع من الطلبات.",
    wfModeChain: "سلسلة تسلسلية",
    wfModeGroup: "مجموعة معالجين",
    wfModeChainDesc: "موافقون بترتيب محدد، واحداً تلو الآخر.",
    wfModeGroupDesc: "تُسند تلقائياً لأحد المعالجين بشكل دوري.",
    wfChainStepsTitle: "خطوات الموافقة",
    wfAddStep: "إضافة موافق",
    wfNoSteps: "لا توجد خطوات بعد — أضف موافقاً واحداً على الأقل.",
    wfGroupTitle: "مجموعة المعالجين",
    wfGroupInfo: "دوري",
    wfAddHandler: "إضافة",
    wfNoHandlers: "لا يوجد معالجون بعد — أضف معالجاً واحداً على الأقل.",
    wfSelectUser: "اختر مستخدماً…",
    wfSearchUsers: "ابحث بالاسم أو الدور…",
    wfFlowPreview: "معاينة مباشرة",
    wfFlowStart: "طلب جديد",
    wfFlowEnd: "موافق عليه",
    wfGroupAssigned: "تعيين تلقائي",
    wfMoveUp: "تحريك لأعلى",
    wfMoveDown: "تحريك لأسفل",
    wfSave: "حفظ مسار العمل",
    wfCancel: "إلغاء",
    wfSaveSuccess: "تم حفظ مسار العمل بنجاح",
    wfSaveError: "فشل في حفظ مسار العمل",
    wfEmptyHint: "اضغط لإعداد مسار الموافقة لهذا النوع من الطلبات.",
    wfRoundRobinNote:
      "تُسند الطلبات لمعالج واحد في كل مرة، مع التنقل بين المجموعة.",
  },
};

// ─── Type meta ────────────────────────────────────────────────────────────────
const TYPE_META = [
  {
    type: "PurchaseRequest",
    icon: <ShoppingCart className="h-5 w-5" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    accentColor: "#3b82f6",
    chipBg: "bg-blue-100",
    chipText: "text-blue-700",
    previewBg: "bg-blue-50",
    previewBorder: "border-blue-100",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  {
    type: "TransportRequest",
    icon: <Truck className="h-5 w-5" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    accentColor: "#10b981",
    chipBg: "bg-emerald-100",
    chipText: "text-emerald-700",
    previewBg: "bg-emerald-50",
    previewBorder: "border-emerald-100",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  {
    type: "FoodRequest",
    icon: <UtensilsCrossed className="h-5 w-5" />,
    color: "text-orange-600",
    bg: "bg-orange-50",
    accentColor: "#f97316",
    chipBg: "bg-orange-100",
    chipText: "text-orange-700",
    previewBg: "bg-orange-50",
    previewBorder: "border-orange-100",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
  },
  {
    type: "FundRequest",
    icon: <Wallet className="h-5 w-5" />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    accentColor: "#7c3aed",
    chipBg: "bg-violet-100",
    chipText: "text-violet-700",
    previewBg: "bg-violet-50",
    previewBorder: "border-violet-100",
    badgeClass:
      "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100",
  },
  {
    type: "MaintenanceRequest",
    icon: <Wrench className="h-5 w-5" />,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    accentColor: "#d97706",
    chipBg: "bg-yellow-100",
    chipText: "text-yellow-700",
    previewBg: "bg-yellow-50",
    previewBorder: "border-yellow-100",
    badgeClass:
      "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  },
  {
    type: "PrintingRequest",
    icon: <Printer className="h-5 w-5" />,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    accentColor: "#0891b2",
    chipBg: "bg-cyan-100",
    chipText: "text-cyan-700",
    previewBg: "bg-cyan-50",
    previewBorder: "border-cyan-100",
    badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
  },
  {
    type: "RiskReport",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-red-600",
    bg: "bg-red-50",
    accentColor: "#dc2626",
    chipBg: "bg-red-100",
    chipText: "text-red-700",
    previewBg: "bg-red-50",
    previewBorder: "border-red-100",
    badgeClass: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  },
];

// ─── WorkflowConfigModal ───────────────────────────────────────────────────────
function WorkflowConfigModal({
  open,
  requestType,
  initialConfig,
  users,
  onClose,
  onSave,
}) {
  const { lang } = useLanguage();
  const t = (k) => WF_T[lang][k];

  const [mode, setMode] = useState("chain");
  const [steps, setSteps] = useState([]);
  const [handlers, setHandlers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(initialConfig?.workflowType || "chain");
    setSteps(
      (initialConfig?.steps || []).map((s, i) => ({
        id: i,
        userId: s.approverId?._id || s.approverId || "",
        role: s.role || "",
      })),
    );
    setHandlers(
      (initialConfig?.handlerGroup || []).map((h, i) => ({
        id: i,
        userId: h.handlerId?._id || h.handlerId || "",
        handlerName: h.handlerName || "",
        handlerRole: h.handlerRole || "",
      })),
    );
    setSelectedUserId("");
    setUserSearch("");
  }, [open, initialConfig]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.personal_name?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  // Step operations
  const addStep = () =>
    setSteps((prev) => [...prev, { id: Date.now(), userId: "", role: "" }]);
  const removeStep = (id) =>
    setSteps((prev) => prev.filter((s) => s.id !== id));
  const updateStep = (id, key, value) =>
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, [key]: value };
        if (key === "userId") {
          const u = users.find((u) => u._id === value);
          next.role = u?.role || "";
        }
        return next;
      }),
    );
  const moveStep = (idx, dir) => {
    const arr = [...steps];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSteps(arr);
  };

  // Handler operations
  const addHandler = () => {
    if (!selectedUserId) return;
    const u = users.find((u) => u._id === selectedUserId);
    if (!u || handlers.some((h) => h.userId === selectedUserId)) return;
    setHandlers((prev) => [
      ...prev,
      {
        id: Date.now(),
        userId: u._id,
        handlerName: u.personal_name,
        handlerRole: u.role,
      },
    ]);
    setSelectedUserId("");
    setUserSearch("");
  };
  const removeHandler = (id) =>
    setHandlers((prev) => prev.filter((h) => h.id !== id));

  const handleSave = async () => {
    setSaving(true);
    const config = {
      workflowType: mode,
      steps: steps.map((s, i) => ({
        sequence_value: i + 1,
        role: s.role,
        approverId: s.userId,
      })),
      handlerGroup: handlers.map((h) => ({
        handlerId: h.userId,
        handlerName: h.handlerName,
        handlerRole: h.handlerRole,
      })),
    };
    const ok = await onSave(requestType, config);
    setSaving(false);
    if (ok) {
      toast.success(t("wfSaveSuccess"));
      onClose();
    } else {
      toast.error(t("wfSaveError"));
    }
  };

  const typeMeta = TYPE_META.find((m) => m.type === requestType);
  const typeName = t("wfTypeNames")?.[requestType] || requestType;
  const hasPreview =
    mode === "chain" ? steps.some((s) => s.userId) : handlers.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center gap-3">
            {typeMeta && (
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeMeta.bg} ${typeMeta.color}`}>
                {typeMeta.icon}
              </span>
            )}
            <div>
              <p className="text-[15px] font-semibold leading-tight">
                {typeName}
              </p>
              <p className="text-xs font-normal text-muted-foreground mt-0.5">
                {t("wfModalDesc")}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("wfModalDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-3">
          {/* ── Mode toggle (segmented control) */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-muted/40 p-1.5">
            {[
              {
                value: "chain",
                label: t("wfModeChain"),
                icon: <GitBranch className="h-4 w-4" />,
                desc: t("wfModeChainDesc"),
                count: `${steps.length}`,
              },
              {
                value: "group",
                label: t("wfModeGroup"),
                icon: <UsersRound className="h-4 w-4" />,
                desc: t("wfModeGroupDesc"),
                count: `${handlers.length}`,
              },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-start transition-all ${
                  mode === opt.value
                    ? "bg-background shadow-sm ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <span
                  className={`mt-0.5 shrink-0 transition-colors ${mode === opt.value ? "text-primary" : ""}`}>
                  {opt.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold leading-none">
                      {opt.label}
                    </span>
                    {parseInt(opt.count) > 0 && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0 text-[10px] font-bold text-primary leading-tight">
                        {opt.count}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    {opt.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* ── Chain mode: step list */}
          {mode === "chain" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("wfChainStepsTitle")}
                </p>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold">
                  {steps.length}&nbsp;{t("wfSteps")}
                </Badge>
              </div>

              {steps.length === 0 ? (
                <div className="flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-border py-10 text-center bg-muted/10">
                  <GitBranch className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground max-w-[220px] leading-snug">
                    {t("wfNoSteps")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/30">
                      {/* Up/down reorder */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          title={t("wfMoveUp")}
                          onClick={() => moveStep(idx, -1)}
                          disabled={idx === 0}
                          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20 transition-colors">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title={t("wfMoveDown")}
                          onClick={() => moveStep(idx, 1)}
                          disabled={idx === steps.length - 1}
                          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20 transition-colors">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Step number badge */}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        {idx + 1}
                      </span>

                      {/* User select */}
                      <select
                        value={step.userId}
                        onChange={(e) =>
                          updateStep(step.id, "userId", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                        <option value="">{t("wfSelectUser")}</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.personal_name} ({u.role})
                          </option>
                        ))}
                      </select>

                      {/* Auto-filled role pill */}
                      {step.role && (
                        <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary whitespace-nowrap">
                          {step.role}
                        </span>
                      )}

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                className="w-full border-dashed hover:border-primary/50 hover:text-primary">
                <Plus className="h-3.5 w-3.5 me-1.5" />
                {t("wfAddStep")}
              </Button>
            </div>
          )}

          {/* ── Group mode: handler pool */}
          {mode === "group" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("wfGroupTitle")}
                </p>
                <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-semibold text-violet-700">
                  <RotateCcw className="h-3 w-3" />
                  {t("wfGroupInfo")}
                </span>
              </div>

              {handlers.length === 0 ? (
                <div className="flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-border py-10 text-center bg-muted/10">
                  <UsersRound className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground max-w-[220px] leading-snug">
                    {t("wfNoHandlers")}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {handlers.map((h, idx) => (
                    <div
                      key={h.id}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/30">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                        {h.handlerName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none">
                          {h.handlerName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {h.handlerRole}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeHandler(h.id)}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add handler panel */}
              <div className="rounded-xl border border-dashed border-border bg-muted/10 p-3 space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("wfSearchUsers")}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">{t("wfSelectUser")}</option>
                    {filteredUsers
                      .filter((u) => !handlers.some((h) => h.userId === u._id))
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.personal_name} ({u.role})
                        </option>
                      ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addHandler}
                    disabled={!selectedUserId}
                    className="shrink-0">
                    <Plus className="h-3.5 w-3.5 me-1" />
                    {t("wfAddHandler")}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  {t("wfRoundRobinNote")}
                </p>
              </div>
            </div>
          )}

          {/* ── Live flow preview */}
          {hasPreview && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("wfFlowPreview")}
                </p>
              </div>
              <div className="flex items-center flex-wrap gap-1.5">
                {/* Start node */}
                <span className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground shadow-sm">
                  {t("wfFlowStart")}
                </span>

                {mode === "chain" &&
                  steps
                    .filter((s) => s.userId)
                    .map((step, i) => {
                      const u = users.find((u) => u._id === step.userId);
                      return (
                        <React.Fragment key={step.id}>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[11px] font-semibold text-primary">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shrink-0">
                              {i + 1}
                            </span>
                            {u?.personal_name || step.role || "?"}
                          </span>
                        </React.Fragment>
                      );
                    })}

                {mode === "group" && handlers.length > 0 && (
                  <>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex items-center gap-1.5 rounded-lg bg-violet-100 border border-violet-200 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700">
                      <UsersRound className="h-3.5 w-3.5 shrink-0" />
                      {handlers.length}&nbsp;{t("wfHandlers")}
                    </span>
                  </>
                )}

                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 text-[11px] font-semibold text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  {t("wfFlowEnd")}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}>
            {t("wfCancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 me-1.5" />
            )}
            {t("wfSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── WorkflowCard ─────────────────────────────────────────────────────────────
function WorkflowCard({ meta, cfg, onConfigure, t }) {
  const {
    type,
    icon,
    color,
    bg,
    accentColor,
    chipBg,
    chipText,
    previewBg,
    previewBorder,
    badgeClass,
  } = meta;
  const isChain = cfg?.workflowType === "chain";
  const isGroup = cfg?.workflowType === "group";
  const configured =
    cfg && (isChain ? cfg.steps?.length > 0 : cfg.handlerGroup?.length > 0);
  const count = isChain
    ? (cfg?.steps?.length ?? 0)
    : (cfg?.handlerGroup?.length ?? 0);

  return (
    <div
      className="group relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ borderTopWidth: 3, borderTopColor: accentColor }}
      onClick={() => onConfigure(type)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onConfigure(type)}>
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg} ${color} transition-transform group-hover:scale-105`}>
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {t("wfTypeNames")?.[type] || type}
            </p>
            {configured ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                {count}&nbsp;{isChain ? t("wfSteps") : t("wfHandlers")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("wfEmptyHint").split(".")[0]}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {configured ? (
            <Badge className={`text-[10px] font-semibold border ${badgeClass}`}>
              {isChain ? t("wfChain") : t("wfGroup")}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] font-semibold text-amber-600 border-amber-300 bg-amber-50">
              {t("wfNotConfigured")}
            </Badge>
          )}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors group-hover:border-border group-hover:bg-muted group-hover:text-foreground">
            <Settings2 className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* Flow visualization area */}
      <div className="px-5 pb-5">
        {/* Chain: pipeline visualization */}
        {configured && isChain && cfg.steps.length > 0 && (
          <div
            className={`rounded-xl ${previewBg} border ${previewBorder} px-3 py-3`}>
            <div className="flex flex-wrap items-center gap-1.5">
              {cfg.steps
                .slice()
                .sort((a, b) => a.sequence_value - b.sequence_value)
                .map((step, i) => (
                  <React.Fragment key={i}>
                    <div
                      className={`flex items-center gap-1.5 rounded-full ${chipBg} ${chipText} px-2.5 py-1 text-[11px] font-semibold`}>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/60 text-[9px] font-bold">
                        {i + 1}
                      </span>
                      {step.approverId?.personal_name || step.role}
                    </div>
                    {i < cfg.steps.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
            </div>
          </div>
        )}

        {/* Group: stacked avatars + info */}
        {configured && isGroup && cfg.handlerGroup.length > 0 && (
          <div
            className={`flex items-center gap-3 rounded-xl ${previewBg} border ${previewBorder} px-3 py-3`}>
            <div className="flex -space-x-2 shrink-0">
              {cfg.handlerGroup.slice(0, 5).map((h, i) => (
                <div
                  key={i}
                  title={h.handlerName || h.handlerId?.personal_name}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-200 text-violet-800 text-[11px] font-bold shadow-sm">
                  {(h.handlerName ||
                    h.handlerId?.personal_name ||
                    "?")?.[0]?.toUpperCase()}
                </div>
              ))}
              {cfg.handlerGroup.length > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-muted text-muted-foreground text-[10px] font-bold">
                  +{cfg.handlerGroup.length - 5}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {cfg.handlerGroup.length}&nbsp;{t("wfHandlers")}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <RotateCcw className="h-3 w-3 text-violet-600" />
                <p className="text-[11px] text-violet-600 font-medium">
                  {t("wfGroupInfo")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Not configured empty state */}
        {!configured && (
          <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border/70 bg-muted/10 px-4 py-3.5 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("wfEmptyHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WorkflowDashboard ─────────────────────────────────────────────────────────
const WorkflowDashboard = () => {
  const {
    workflows,
    workflowsLoading,
    fetchWorkflows,
    users,
    fetchUsers,
    workflowModal,
    openWorkflowModal,
    closeWorkflowModal,
    saveWorkflow,
  } = useAdminDashboard();

  const { lang } = useLanguage();
  const t = (k) => WF_T[lang][k];

  useEffect(() => {
    fetchWorkflows();
    fetchUsers();
  }, [fetchWorkflows, fetchUsers]);

  const configuredCount = useMemo(
    () =>
      TYPE_META.filter(({ type }) => {
        const cfg = workflows.find((w) => w.type === type);
        return (
          cfg &&
          (cfg.workflowType === "chain"
            ? cfg.steps?.length > 0
            : cfg.handlerGroup?.length > 0)
        );
      }).length,
    [workflows],
  );
  const pendingCount = TYPE_META.length - configuredCount;
  const progressPct = Math.round((configuredCount / TYPE_META.length) * 100);

  return (
    <div className="space-y-6">
      {/* ── Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <GitBranch className="h-5 w-5 text-primary" />
            {t("pageTitle")}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("pageSubtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchWorkflows();
            fetchUsers();
          }}
          disabled={workflowsLoading}>
          <RefreshCw
            className={`h-3.5 w-3.5 me-1.5 ${workflowsLoading ? "animate-spin" : ""}`}
          />
          {t("refresh")}
        </Button>
      </div>

      {/* ── Summary stats bar */}
      {!workflowsLoading && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-muted/30 px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("statsTotal")}:</span>
            <span className="font-bold text-foreground">
              {TYPE_META.length}
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="font-bold text-green-700">{configuredCount}</span>
            <span className="text-muted-foreground">
              {t("statsConfigured")}
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-1.5 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-amber-700">{pendingCount}</span>
            <span className="text-muted-foreground">{t("statsPending")}</span>
          </div>
          <div className="ms-auto flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted-foreground">
              {t("statsProgress")}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-28 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground w-8">
                {progressPct}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading skeleton */}
      {workflowsLoading ? (
        <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-9 w-9 animate-spin text-primary/40" />
          <span className="text-sm">{t("wfLoadingLabel")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TYPE_META.map((meta) => (
            <WorkflowCard
              key={meta.type}
              meta={meta}
              cfg={workflows.find((w) => w.type === meta.type)}
              onConfigure={openWorkflowModal}
              t={t}
            />
          ))}
        </div>
      )}

      {/* ── Configure modal */}
      <WorkflowConfigModal
        open={workflowModal.open}
        requestType={workflowModal.requestType}
        initialConfig={workflowModal.config}
        users={users}
        onClose={closeWorkflowModal}
        onSave={saveWorkflow}
      />
    </div>
  );
};

export default WorkflowDashboard;
