import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import api from "../../lib/api";
import { useLanguage } from "../../lib/LanguageContext";
import {
  Search,
  Loader2,
  Inbox,
  RefreshCw,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Package,
  User,
  Calendar,
  DollarSign,
  FileText,
  Truck,
  Banknote,
  Laptop,
  ShoppingCart,
  UtensilsCrossed,
  Wrench,
  Printer,
  AlertTriangle,
} from "lucide-react";

/* ── helpers ───────────────────────────────────────────────── */
const statusVariant = (s) =>
  ({
    Approved: "success",
    Rejected: "destructive",
    Pending: "warning",
    "In Progress": "default",
    "Under Review": "warning",
    Resolved: "success",
  })[s] ?? "secondary";

const urgencyVariant = (u) =>
  ({ High: "destructive", Medium: "warning", Low: "success" })[u] ??
  "secondary";

const urgencyAr = { High: "عاجل", Medium: "متوسط", Low: "عادي" };
const statusAr = {
  Approved: "مقبول",
  Rejected: "مرفوض",
  Pending: "قيد الانتظار",
  "In Progress": "جارٍ التنفيذ",
  "Under Review": "قيد المراجعة",
  Resolved: "تم الحل",
};

const TYPE_CONFIG = {
  PurchaseRequest: {
    en: "Purchase",
    ar: "شراء",
    icon: ShoppingCart,
    color: "bg-blue-100 text-blue-700",
  },
  SoftwareRequest: {
    en: "Software",
    ar: "برمجيات",
    icon: Laptop,
    color: "bg-indigo-100 text-indigo-700",
  },
  TransportRequest: {
    en: "Transport",
    ar: "نقل",
    icon: Truck,
    color: "bg-purple-100 text-purple-700",
  },
  FoodRequest: {
    en: "Food",
    ar: "تغذية",
    icon: UtensilsCrossed,
    color: "bg-orange-100 text-orange-700",
  },
  FundRequest: {
    en: "Fund",
    ar: "تمويل",
    icon: Banknote,
    color: "bg-green-100 text-green-700",
  },
  MaintenanceRequest: {
    en: "Maintenance",
    ar: "صيانة",
    icon: Wrench,
    color: "bg-yellow-100 text-yellow-700",
  },
  PrintingRequest: {
    en: "Printing",
    ar: "طباعة",
    icon: Printer,
    color: "bg-slate-100 text-slate-700",
  },
  RiskReport: {
    en: "Risk Report",
    ar: "بلاغ مخاطر",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-700",
  },
};

const getDisplayTitle = (req) => {
  switch (req.requestType) {
    case "TransportRequest":
      return req.destination || req.requestId;
    case "FoodRequest":
      return req.occasionName || req.requestId;
    case "FundRequest":
      return req.purposeTitle || req.requestId;
    case "MaintenanceRequest":
      return req.type || req.requestId;
    case "PrintingRequest":
      return req.documentType || req.requestId;
    case "RiskReport":
      return req.riskType || req.requestId;
    default:
      return req.itemName || req.requestId;
  }
};

const getTypeKey = (req) =>
  req.requestType === "PurchaseRequest" && req.requestCategory === "Software"
    ? "SoftwareRequest"
    : req.requestType;

const fmt = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/* ── stat card ─────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, colorClass }) => (
  <Card className="flex-1 min-w-[110px]">
    <CardContent className="pt-4 pb-3 flex flex-col items-center gap-1 text-center">
      <span className={`${colorClass} mb-0.5`}>{icon}</span>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </CardContent>
  </Card>
);

/* ── approval step dot ──────────────────────────────────────── */
const stepColor = (action) => {
  if (action === "Approved") return "bg-green-500 border-green-500";
  if (action === "Rejected") return "bg-red-500 border-red-500";
  return "bg-background border-muted-foreground/40";
};

const stepLineColor = (action) => {
  if (action === "Approved") return "bg-green-400";
  if (action === "Rejected") return "bg-red-400";
  return "bg-border";
};

/* ════════════════════════════════════════════════════════════ */
const TrackRequest = () => {
  const user = useSelector((s) => s.users.user);
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [searchVal, setSearchVal] = useState("");

  // ── fetch all 4 request types for this user ───────────────
  const fetchRequests = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/requests/my/${user._id}`);
      setRequests(data.requests ?? []);
    } catch {
      toast.error(ar ? "تعذّر تحميل الطلبات" : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [user, ar]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── in-memory search / filter ─────────────────────────────
  const filtered = searchVal.trim()
    ? requests.filter((r) => {
        const q = searchVal.trim().toLowerCase();
        return (
          r.requestId?.toLowerCase().includes(q) ||
          getDisplayTitle(r).toLowerCase().includes(q)
        );
      })
    : requests;

  // ── stats ──────────────────────────────────────────────────
  const total = requests.length;
  const pending = requests.filter((r) => r.status === "Pending").length;
  const approved = requests.filter((r) => r.status === "Approved").length;
  const rejected = requests.filter((r) => r.status === "Rejected").length;

  // ── detail panel ───────────────────────────────────────────
  const DetailPanel = ({ req }) => {
    if (!req) return null;
    const totalSteps = req.approvalFlow?.length ?? 0;
    const completedSteps =
      req.approvalFlow?.filter((s) => s.action !== "Pending").length ?? 0;
    const progressPct = totalSteps
      ? Math.round((completedSteps / totalSteps) * 100)
      : 0;

    const typeConf =
      TYPE_CONFIG[getTypeKey(req)] ?? TYPE_CONFIG.PurchaseRequest;
    const TypeIcon = typeConf.icon;

    // Build type-specific field rows
    const typeFields = [];
    if (req.requestType === "PurchaseRequest") {
      if (req.itemName)
        typeFields.push({
          icon: <Package className="h-3.5 w-3.5" />,
          label: ar ? "الصنف" : "Item",
          val: req.itemName,
        });
      if (req.quantity)
        typeFields.push({
          icon: <ClipboardList className="h-3.5 w-3.5" />,
          label: ar ? "الكمية" : "Quantity",
          val: req.quantity,
        });
      if (req.estimatedBudget)
        typeFields.push({
          icon: <DollarSign className="h-3.5 w-3.5" />,
          label: ar ? "الميزانية التقديرية" : "Est. Budget",
          val: req.estimatedBudget,
        });
      if (req.expectedDeliveryDate)
        typeFields.push({
          icon: <Calendar className="h-3.5 w-3.5" />,
          label: ar ? "التسليم المتوقع" : "Expected Delivery",
          val: fmt(req.expectedDeliveryDate),
        });
    } else if (req.requestType === "TransportRequest") {
      if (req.destination)
        typeFields.push({
          icon: <Truck className="h-3.5 w-3.5" />,
          label: ar ? "الوجهة" : "Destination",
          val: req.destination,
        });
      if (req.departureDate)
        typeFields.push({
          icon: <Calendar className="h-3.5 w-3.5" />,
          label: ar ? "تاريخ المغادرة" : "Departure",
          val: fmt(req.departureDate),
        });
      if (req.returnDate)
        typeFields.push({
          icon: <Calendar className="h-3.5 w-3.5" />,
          label: ar ? "تاريخ العودة" : "Return",
          val: fmt(req.returnDate),
        });
      if (req.numberOfPassengers)
        typeFields.push({
          icon: <User className="h-3.5 w-3.5" />,
          label: ar ? "عدد الركاب" : "Passengers",
          val: req.numberOfPassengers,
        });
    } else if (req.requestType === "FoodRequest") {
      if (req.occasionName)
        typeFields.push({
          icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
          label: ar ? "المناسبة" : "Occasion",
          val: req.occasionName,
        });
      if (req.eventDate)
        typeFields.push({
          icon: <Calendar className="h-3.5 w-3.5" />,
          label: ar ? "تاريخ الحدث" : "Event Date",
          val: fmt(req.eventDate),
        });
      if (req.mealType)
        typeFields.push({
          icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
          label: ar ? "نوع الوجبة" : "Meal Type",
          val: req.mealType,
        });
      if (req.numberOfPersons)
        typeFields.push({
          icon: <User className="h-3.5 w-3.5" />,
          label: ar ? "عدد الأشخاص" : "Persons",
          val: req.numberOfPersons,
        });
      if (req.location)
        typeFields.push({
          icon: <FileText className="h-3.5 w-3.5" />,
          label: ar ? "الموقع" : "Location",
          val: req.location,
        });
    } else if (req.requestType === "FundRequest") {
      if (req.purposeTitle)
        typeFields.push({
          icon: <Banknote className="h-3.5 w-3.5" />,
          label: ar ? "الغرض" : "Purpose",
          val: req.purposeTitle,
        });
      if (req.amountRequested)
        typeFields.push({
          icon: <DollarSign className="h-3.5 w-3.5" />,
          label: ar ? "المبلغ المطلوب" : "Amount",
          val: `${req.amountRequested} ${req.currency || "OMR"}`,
        });
      if (req.expectedDateNeeded)
        typeFields.push({
          icon: <Calendar className="h-3.5 w-3.5" />,
          label: ar ? "التاريخ المطلوب" : "Date Needed",
          val: fmt(req.expectedDateNeeded),
        });
    } else if (req.requestType === "MaintenanceRequest") {
      if (req.type)
        typeFields.push({
          icon: <Wrench className="h-3.5 w-3.5" />,
          label: ar ? "نوع الصيانة" : "Type",
          val: req.type,
        });
      if (req.location)
        typeFields.push({
          icon: <FileText className="h-3.5 w-3.5" />,
          label: ar ? "الموقع" : "Location",
          val: req.location,
        });
      if (req.severity)
        typeFields.push({
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          label: ar ? "الخطورة" : "Severity",
          val: req.severity,
        });
      if (req.risk)
        typeFields.push({
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          label: ar ? "خطر" : "Risk",
          val: req.risk,
        });
      if (req.dateTime)
        typeFields.push({
          icon: <Calendar className="h-3.5 w-3.5" />,
          label: ar ? "التاريخ والوقت" : "Date & Time",
          val: req.dateTime,
        });
      if (req.description)
        typeFields.push({
          icon: <FileText className="h-3.5 w-3.5" />,
          label: ar ? "الوصف" : "Description",
          val: req.description,
        });
    } else if (req.requestType === "PrintingRequest") {
      if (req.documentType)
        typeFields.push({
          icon: <Printer className="h-3.5 w-3.5" />,
          label: ar ? "نوع المستند" : "Document Type",
          val: req.documentType,
        });
      if (req.orientation)
        typeFields.push({
          icon: <FileText className="h-3.5 w-3.5" />,
          label: ar ? "الاتجاه" : "Orientation",
          val: req.orientation,
        });
      if (req.numPages)
        typeFields.push({
          icon: <ClipboardList className="h-3.5 w-3.5" />,
          label: ar ? "عدد الصفحات" : "Pages",
          val: req.numPages,
        });
      if (req.numSets)
        typeFields.push({
          icon: <ClipboardList className="h-3.5 w-3.5" />,
          label: ar ? "عدد النسخ" : "Sets",
          val: req.numSets,
        });
      if (req.stapling != null)
        typeFields.push({
          icon: <FileText className="h-3.5 w-3.5" />,
          label: ar ? "تدبيس" : "Stapling",
          val: req.stapling ? (ar ? "نعم" : "Yes") : ar ? "لا" : "No",
        });
    } else if (req.requestType === "RiskReport") {
      if (req.riskType)
        typeFields.push({
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          label: ar ? "نوع الخطر" : "Risk Type",
          val: req.riskType,
        });
      if (req.location)
        typeFields.push({
          icon: <FileText className="h-3.5 w-3.5" />,
          label: ar ? "الموقع" : "Location",
          val: req.location,
        });
      if (req.urgency)
        typeFields.push({
          icon: <Clock className="h-3.5 w-3.5" />,
          label: ar ? "الأهمية" : "Urgency",
          val: req.urgency,
        });
      if (req.description)
        typeFields.push({
          icon: <FileText className="h-3.5 w-3.5" />,
          label: ar ? "الوصف" : "Description",
          val: req.description,
        });
      if (req.actionRequested)
        typeFields.push({
          icon: <ClipboardList className="h-3.5 w-3.5" />,
          label: ar ? "الإجراء المطلوب" : "Action Requested",
          val: req.actionRequested,
        });
    }
    typeFields.push(
      {
        icon: <Calendar className="h-3.5 w-3.5" />,
        label: ar ? "تاريخ الإرسال" : "Submitted",
        val: fmt(req.createdAt),
      },
      {
        icon: <User className="h-3.5 w-3.5" />,
        label: ar ? "مقدم الطلب" : "Requester",
        val: req.requesterId?.personal_name ?? user?.personal_name ?? "—",
      },
    );

    return (
      <Card className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">
                {getDisplayTitle(req)}
              </CardTitle>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${typeConf.color}`}>
                <TypeIcon className="h-3 w-3" />
                {ar ? typeConf.ar : typeConf.en}
              </span>
              <Badge variant={statusVariant(req.status)}>
                {ar ? statusAr[req.status] : req.status}
              </Badge>
              <Badge variant={urgencyVariant(req.urgency)}>
                {ar ? urgencyAr[req.urgency] : req.urgency}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {req.requestId}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-8 w-8 p-0"
            onClick={() => setSelected(null)}>
            <XCircle className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Assigned handler (group mode) */}
          {req.assignedHandler && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5">
              <User className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {ar ? "المعالج المعين" : "Assigned Handler"}
                </p>
                <p className="text-sm font-medium">
                  {req.assignedHandler?.personal_name ??
                    (ar ? "معين" : "Assigned")}
                  <Badge
                    variant={statusVariant(req.status)}
                    className="ms-2 text-[10px] py-0">
                    {ar ? statusAr[req.status] : req.status}
                  </Badge>
                </p>
              </div>
            </div>
          )}

          {/* Progress bar (chain mode) */}
          {req.approvalFlow?.length > 0 && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{ar ? "تقدم الموافقة" : "Approval Progress"}</span>
                <span>
                  {completedSteps} / {totalSteps} {ar ? "خطوات" : "steps"} —{" "}
                  {progressPct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    req.status === "Rejected"
                      ? "bg-red-500"
                      : req.status === "Approved"
                        ? "bg-green-500"
                        : "bg-primary"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Type-specific info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            {typeFields.map(({ icon, label, val }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  {icon} {label}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {val}
                </span>
              </div>
            ))}
          </div>

          {(req.justification || req.purpose || req.dietaryRequirements) && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {ar ? "المبرر / التفاصيل" : "Justification / Details"}
              </p>
              <p className="text-sm text-foreground">
                {req.justification || req.purpose || req.dietaryRequirements}
              </p>
            </div>
          )}

          {req.additionalNotes && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground mb-1">
                {ar ? "ملاحظات إضافية" : "Additional Notes"}
              </p>
              <p className="text-sm text-foreground">{req.additionalNotes}</p>
            </div>
          )}

          {/* Approval Flow Timeline */}
          {req.approvalFlow?.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {ar ? "مسار الموافقة" : "Approval Flow"}
              </h5>

              <div className="space-y-0">
                {req.approvalFlow.map((step, idx) => {
                  const isLast = idx === req.approvalFlow.length - 1;
                  const isCurrent =
                    step.action === "Pending" && idx === req.currentStep - 1;

                  return (
                    <div key={idx} className="flex gap-3">
                      {/* Dot + line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${stepColor(step.action)} ${isCurrent ? "ring-2 ring-primary/40 ring-offset-1" : ""}`}>
                          {step.action === "Approved" && (
                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                          )}
                          {step.action === "Rejected" && (
                            <XCircle className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 flex-1 my-1 min-h-[28px] ${stepLineColor(step.action)}`}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`pb-4 flex-1 ${isLast ? "pb-0" : ""}`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">
                              {step.currentApprover || step.role}
                            </span>
                            <Badge
                              variant={statusVariant(step.action)}
                              className="text-[10px] py-0">
                              {ar ? statusAr[step.action] : step.action}
                            </Badge>
                            {isCurrent && (
                              <Badge
                                variant="default"
                                className="text-[10px] py-0 animate-pulse">
                                {ar ? "بانتظار الموافقة" : "Awaiting"}
                              </Badge>
                            )}
                          </div>
                          {step.timestamp && (
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {fmt(step.timestamp)}
                            </span>
                          )}
                        </div>
                        {step.comment && (
                          <p className="mt-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                            "{step.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {ar ? "تتبع طلباتي" : "Track My Requests"}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ar
              ? "استعرض حالة طلباتك واعرف من يراجعها"
              : "View your request status and approval progress"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-1.5">
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          {ar ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 flex-wrap">
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          label={ar ? "إجمالي الطلبات" : "Total"}
          value={total}
          colorClass="text-primary"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label={ar ? "قيد الانتظار" : "Pending"}
          value={pending}
          colorClass="text-amber-500"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label={ar ? "مقبولة" : "Approved"}
          value={approved}
          colorClass="text-green-600"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          label={ar ? "مرفوضة" : "Rejected"}
          value={rejected}
          colorClass="text-red-500"
        />
      </div>

      {/* Search */}
      <div className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={
              ar
                ? "ابحث برقم الطلب أو الموضوع..."
                : "Search by ID or subject..."
            }
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="text-sm ps-8"
          />
        </div>
        {searchVal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchVal("");
              setSelected(null);
            }}>
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Detail panel (search result or row click) */}
      {selected && <DetailPanel req={selected} />}

      {/* Requests table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {ar ? "طلباتي" : "My Requests"}
            {searchVal.trim() && (
              <span className="ms-2 font-normal normal-case text-primary">
                — {filtered.length} {ar ? "نتيجة" : "results"}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">
                {ar ? "جار التحميل..." : "Loading..."}
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Inbox className="h-10 w-10 opacity-40" />
              <p className="text-sm">
                {ar ? "لا توجد طلبات" : "No requests found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {[
                      "#",
                      ar ? "رقم الطلب" : "Request ID",
                      ar ? "الموضوع" : "Subject",
                      ar ? "النوع" : "Type",
                      ar ? "الحالة" : "Status",
                      ar ? "الأهمية" : "Urgency",
                      ar ? "تاريخ الإرسال" : "Submitted",
                      ar ? "التقدم" : "Progress",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((req, idx) => {
                    const typeConf =
                      TYPE_CONFIG[getTypeKey(req)] ??
                      TYPE_CONFIG.PurchaseRequest;
                    const TypeIcon = typeConf.icon;
                    const completedCount =
                      req.approvalFlow?.filter((s) => s.action !== "Pending")
                        .length ?? 0;
                    const totalCount = req.approvalFlow?.length ?? 0;
                    return (
                      <tr
                        key={req._id}
                        className={`group transition-colors hover:bg-muted/40 cursor-pointer ${
                          selected?._id === req._id ? "bg-primary/5" : ""
                        }`}
                        onClick={() =>
                          setSelected((prev) =>
                            prev?._id === req._id ? null : req,
                          )
                        }>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-foreground whitespace-nowrap">
                          {req.requestId}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground max-w-[150px] truncate">
                          {getDisplayTitle(req)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${typeConf.color}`}>
                            <TypeIcon className="h-3 w-3" />
                            {ar ? typeConf.ar : typeConf.en}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={statusVariant(req.status)}>
                            {ar ? statusAr[req.status] : req.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={urgencyVariant(req.urgency)}>
                            {ar ? urgencyAr[req.urgency] : req.urgency}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {fmt(req.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {totalCount > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    req.status === "Rejected"
                                      ? "bg-red-500"
                                      : req.status === "Approved"
                                        ? "bg-green-500"
                                        : "bg-primary"
                                  }`}
                                  style={{
                                    width: `${Math.round((completedCount / totalCount) * 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {completedCount}/{totalCount}
                              </span>
                            </div>
                          ) : (
                            <Badge
                              variant={statusVariant(req.status)}
                              className="text-[10px]">
                              {ar ? statusAr[req.status] : req.status}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected((prev) =>
                                prev?._id === req._id ? null : req,
                              );
                            }}>
                            <Eye className="h-3.5 w-3.5" />
                            {ar ? "تفاصيل" : "Details"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackRequest;
