import React from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Search, Eye, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { ADMIN_T } from "./adminTranslations";
import {
  statusVariant,
  urgencyVariant,
  formatDate,
  Detail,
} from "./adminHelpers";

// ─── Per-type config ──────────────────────────────────────────────────────
const TYPE_CONFIG = {
  PurchaseRequest: {
    color: "bg-blue-100 text-blue-700",
    labelEn: "Purchase",
    labelAr: "مشتريات",
    getTitle: (r) => r.itemName || r.itemDescription,
  },
  SoftwareRequest: {
    color: "bg-indigo-100 text-indigo-700",
    labelEn: "Software",
    labelAr: "برمجيات",
    getTitle: (r) => r.itemName || r.itemDescription,
  },
  TransportRequest: {
    color: "bg-amber-100 text-amber-700",
    labelEn: "Transport",
    labelAr: "مواصلات",
    getTitle: (r) => r.destination || r.tripPurpose,
  },
  FoodRequest: {
    color: "bg-green-100 text-green-700",
    labelEn: "Food",
    labelAr: "تغذية",
    getTitle: (r) => r.occasionName || r.eventName,
  },
  FundRequest: {
    color: "bg-purple-100 text-purple-700",
    labelEn: "Fund",
    labelAr: "طلب تمويل",
    getTitle: (r) => r.fundPurpose || r.purposeTitle,
  },
  PrintingRequest: {
    color: "bg-slate-100 text-slate-700",
    labelEn: "Printing",
    labelAr: "طباعة",
    getTitle: (r) => r.documentType || r.examTitle || r.type,
  },
  RiskReport: {
    color: "bg-red-100 text-red-700",
    labelEn: "Risk Report",
    labelAr: "بلاغ مخاطر",
    getTitle: (r) => r.riskType || r.description,
  },
  InstallSoftwareRequest: {
    color: "bg-indigo-100 text-indigo-700",
    labelEn: "Software Install",
    labelAr: "تثبيت برنامج",
    getTitle: (r) => r.softwareName,
  },
  MaintenanceRequest: {
    color: "bg-orange-100 text-orange-700",
    labelEn: "Maintenance",
    labelAr: "صيانة",
    getTitle: (r) => r.type || r.description,
  },
};

const getTypeKey = (req) =>
  req.requestType === "PurchaseRequest" && req.requestCategory === "Software"
    ? "SoftwareRequest"
    : req.requestType;

const getRequestNumber = (req) => req.requestNumber || req.requestId || "—";

const getRequesterName = (req) =>
  req.requesterId?.fullName ||
  req.requesterId?.personal_name ||
  req.requesterName ||
  req.name ||
  "N/A";

const getApprovalTrail = (req) => req.approvalHistory || req.approvalFlow || [];

// ─── RequestsTab (S: renders requests table + filters) ────────────────────
export function RequestsTab({
  requests,
  requestsLoading,
  onViewRequest,
  onDeleteRequest,
}) {
  const { lang } = useLanguage();
  const t = (k) => ADMIN_T[lang][k];
  const [requestSearch, setRequestSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");

  const filteredRequests = React.useMemo(() => {
    if (!requestSearch && statusFilter === "All") return requests;
    const q = requestSearch.toLowerCase();
    return requests.filter((r) => {
      const matchSearch = !q ||
        r.requestId?.toLowerCase().includes(q) ||
        r.requestNumber?.toLowerCase().includes(q) ||
        r.itemName?.toLowerCase().includes(q) ||
        r.itemDescription?.toLowerCase().includes(q) ||
        r.destination?.toLowerCase().includes(q) ||
        r.tripPurpose?.toLowerCase().includes(q) ||
        r.occasionName?.toLowerCase().includes(q) ||
        r.eventName?.toLowerCase().includes(q) ||
        r.fundPurpose?.toLowerCase().includes(q) ||
        r.purposeTitle?.toLowerCase().includes(q) ||
        r.softwareName?.toLowerCase().includes(q) ||
        r.documentType?.toLowerCase().includes(q) ||
        r.examTitle?.toLowerCase().includes(q) ||
        r.riskType?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q) ||
        r.requestType?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) ||
        r.departmentRef?.departmentName?.toLowerCase().includes(q) ||
        r.requesterId?.fullName?.toLowerCase().includes(q) ||
        r.requesterId?.personal_name?.toLowerCase().includes(q) ||
        r.requesterName?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q);
      const s = (r.status || "").toLowerCase();
      const f = statusFilter.toLowerCase();
      const matchStatus =
        statusFilter === "All" ||
        s === f ||
        (f === "approved" && (s === "disbursed" || s === "resolved" || s === "completed")) ||
        (f === "pending" && s === "in_progress");
      return matchSearch && matchStatus;
    });
  }, [requests, requestSearch, statusFilter]);

  const STATUS_FILTERS = [
    { value: "All", label: t("filterAll") },
    { value: "Pending", label: t("filterPending") },
    { value: "Approved", label: t("filterApproved") },
    { value: "Rejected", label: t("filterRejected") },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={lang === "ar" ? "بحث..." : "Search..."}
            value={requestSearch}
            onChange={(e) => setRequestSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {requestsLoading ? (
        <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("loadingRequests")}</span>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colReqId")}</TableHead>
                  <TableHead>{t("colType")}</TableHead>
                  <TableHead>{t("colRequester")}</TableHead>
                  <TableHead>{t("colDept")}</TableHead>
                  <TableHead>{t("colUrgency")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colSubmitted")}</TableHead>
                  <TableHead>{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8">
                      {t("noRequests")}
                    </TableCell>
                  </TableRow>
                )}
                {filteredRequests.map((req) => (
                  <TableRow key={req._id}>
                    <TableCell className="font-mono text-xs">
                      {getRequestNumber(req)}
                    </TableCell>
                    <TableCell className="max-w-[160px] text-sm">
                      {(() => {
                        const cfg = TYPE_CONFIG[getTypeKey(req)];
                        const title = cfg
                          ? cfg.getTitle(req)
                          : req.itemName || req.items || "—";
                        const label = cfg
                          ? lang === "ar"
                            ? cfg.labelAr
                            : cfg.labelEn
                          : req.requestType;
                        return (
                          <div>
                            <span
                              className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg?.color || "bg-gray-100 text-gray-700"}`}>
                              {label}
                            </span>
                            <p
                              className="truncate mt-0.5 text-xs"
                              title={title}>
                              {title || "—"}
                            </p>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getRequesterName(req)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {req.department || req.departmentRef?.departmentName || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={urgencyVariant(req.urgency || req.priority)}>
                        {req.urgency || req.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(req.status)}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(req.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewRequest(req)}>
                        <Eye className="me-1.5 h-3.5 w-3.5" />
                        {t("btnView")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() =>
                          onDeleteRequest(req._id, req.requestType)
                        }>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── RequestDetailsModal (S: only shows request details) ──────────────────
export function RequestDetailsModal({ request, onClose }) {
  const { lang } = useLanguage();
  const t = (k) => ADMIN_T[lang][k];
  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            {request ? getRequestNumber(request) : ""}
          </DialogTitle>
        </DialogHeader>

        {request && (
          <div className="space-y-4 text-sm">
            {/* Common fields */}
            <div className="grid grid-cols-2 gap-3">
              <Detail
                label={t("colType")}
                value={(() => {
                  const cfg = TYPE_CONFIG[request.requestType];
                  const label = cfg
                    ? lang === "ar"
                      ? cfg.labelAr
                      : cfg.labelEn
                    : request.requestType;
                  return (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg?.color || "bg-gray-100 text-gray-700"}`}>
                      {label}
                    </span>
                  );
                })()}
              />
              <Detail
                label={t("fldUrgency")}
                value={
                  <Badge variant={urgencyVariant(request.urgency)}>
                    {request.urgency}
                  </Badge>
                }
              />
              <Detail
                label={t("fldStatus")}
                value={
                  <Badge variant={statusVariant(request.status)}>
                    {request.status}
                  </Badge>
                }
              />
              <Detail
                label={t("fldSubmitted")}
                value={formatDate(request.createdAt)}
              />
              <Detail
                label={t("fldRequester")}
                value={getRequesterName(request)}
              />
              <Detail
                label={t("fldDepartment")}
                value={request.requesterId?.department || "—"}
              />
            </div>

            {/* Purchase-specific fields */}
            {request.requestType === "PurchaseRequest" && (
              <div className="grid grid-cols-2 gap-3">
                <Detail label={t("fldItem")} value={request.itemName || request.items} />
                <Detail label={t("fldQuantity")} value={request.quantity} />
                <Detail
                  label={t("fldBudget")}
                  value={request.estimatedBudget || "—"}
                />
                {request.expectedDeliveryDate && (
                  <Detail
                    label={t("fldExpectedDelivery")}
                    value={formatDate(request.expectedDeliveryDate)}
                  />
                )}
              </div>
            )}

            {/* Transport-specific fields */}
            {request.requestType === "TransportRequest" && (
              <div className="grid grid-cols-2 gap-3">
                <Detail
                  label={t("fldDestination")}
                  value={request.destination}
                />
                <Detail
                  label={t("fldPassengers")}
                  value={request.numberOfPassengers}
                />
                <Detail
                  label={t("fldDeparture")}
                  value={formatDate(request.departureDate)}
                />
                {request.returnDate && (
                  <Detail
                    label={t("fldReturnDate")}
                    value={formatDate(request.returnDate)}
                  />
                )}
                <Detail label={t("fldPurpose")} value={request.purpose} />
              </div>
            )}

            {/* Food-specific fields */}
            {request.requestType === "FoodRequest" && (
              <div className="grid grid-cols-2 gap-3">
                <Detail label={t("fldOccasion")} value={request.occasionName} />
                <Detail
                  label={t("fldEventDate")}
                  value={formatDate(request.eventDate)}
                />
                <Detail
                  label={t("fldPersons")}
                  value={request.numberOfPersons}
                />
                <Detail label={t("fldMealType")} value={request.mealType} />
                <Detail label={t("fldLocation")} value={request.location} />
                {request.dietaryRequirements && (
                  <Detail
                    label={t("fldDietary")}
                    value={request.dietaryRequirements}
                  />
                )}
              </div>
            )}

            {/* Fund-specific fields */}
            {request.requestType === "FundRequest" && (
              <div className="grid grid-cols-2 gap-3">
                <Detail
                  label={t("fldPurposeTitle")}
                  value={request.purposeTitle}
                />
                <Detail
                  label={t("fldAmount")}
                  value={`${request.amountRequested} ${request.currency || "OMR"}`}
                />
                {request.expectedDateNeeded && (
                  <Detail
                    label={t("fldDateNeeded")}
                    value={formatDate(request.expectedDateNeeded)}
                  />
                )}
              </div>
            )}

            {request.requestType === "PrintingRequest" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Detail
                    label={t("fldDocumentType") || "Document Type"}
                    value={request.type || request.documentType}
                  />
                  <Detail
                    label={t("fldOrientation") || "Orientation"}
                    value={request.orientation}
                  />
                  <Detail
                    label={t("fldPages") || "Pages per Exam"}
                    value={request.pagesPerExam || request.numPages}
                  />
                  <Detail
                    label={t("fldCopies") || "Copies / Sets"}
                    value={request.setsCount || request.numSets}
                  />
                  {request.recipientName && (
                    <Detail label="Recipient Name" value={request.recipientName} />
                  )}
                </div>
                {(request.examFileUrl || request.certificateFileUrl || request.recipientsListUrl) && (
                  <div className="rounded-md border border-border px-3 py-2 space-y-1.5">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Attached Files</p>
                    {(request.examFileUrl || request.certificateFileUrl) && (
                      <a
                        href={`${process.env.REACT_APP_API_URL || "http://localhost:8080"}/${request.examFileUrl || request.certificateFileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline">
                        Download Document
                      </a>
                    )}
                    {request.recipientsListUrl && (
                      <a
                        href={`${process.env.REACT_APP_API_URL || "http://localhost:8080"}/${request.recipientsListUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline">
                        Download Recipients List
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {request.justification && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {t("fldJustification")}
                </p>
                <p className="text-sm text-foreground bg-muted/40 rounded-md p-3">
                  {request.justification}
                </p>
              </div>
            )}

            {getApprovalTrail(request).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {t("approvalFlow")}
                </p>
                <div className="space-y-2">
                  {getApprovalTrail(request).map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                      <div
                        className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                          step.action === "Approved"
                            ? "bg-green-500"
                            : step.action === "Rejected"
                              ? "bg-red-500"
                              : "bg-amber-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {t("step")} {i + 1} — {step.role}
                          </span>
                          <Badge
                            variant={
                              step.action === "Approved"
                                ? "success"
                                : step.action === "Rejected"
                                  ? "destructive"
                                  : "warning"
                            }
                            className="text-[10px]">
                            {step.action}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.currentApprover}
                        </p>
                        {step.comment && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "{step.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("btnClose")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
