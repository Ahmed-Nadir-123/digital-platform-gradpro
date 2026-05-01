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
    getTitle: (r) => r.itemName,
  },
  SoftwareRequest: {
    color: "bg-indigo-100 text-indigo-700",
    labelEn: "Software",
    labelAr: "برمجيات",
    getTitle: (r) => r.itemName,
  },
  TransportRequest: {
    color: "bg-amber-100 text-amber-700",
    labelEn: "Transport",
    labelAr: "مواصلات",
    getTitle: (r) => r.destination,
  },
  FoodRequest: {
    color: "bg-green-100 text-green-700",
    labelEn: "Food",
    labelAr: "تغذية",
    getTitle: (r) => r.occasionName,
  },
  FundRequest: {
    color: "bg-purple-100 text-purple-700",
    labelEn: "Fund",
    labelAr: "صندوق",
    getTitle: (r) => r.purposeTitle,
  },
  MaintenanceRequest: {
    color: "bg-yellow-100 text-yellow-700",
    labelEn: "Maintenance",
    labelAr: "صيانة",
    getTitle: (r) => r.type,
  },
  PrintingRequest: {
    color: "bg-slate-100 text-slate-700",
    labelEn: "Printing",
    labelAr: "طباعة",
    getTitle: (r) => r.documentType,
  },
  RiskReport: {
    color: "bg-red-100 text-red-700",
    labelEn: "Risk Report",
    labelAr: "بلاغ مخاطر",
    getTitle: (r) => r.riskType,
  },
};

const getTypeKey = (req) =>
  req.requestType === "PurchaseRequest" && req.requestCategory === "Software"
    ? "SoftwareRequest"
    : req.requestType;

// ─── RequestsTab (S: renders requests table + filters) ────────────────────
export function RequestsTab({
  filteredRequests,
  requestsLoading,
  requestSearch,
  setRequestSearch,
  statusFilter,
  setStatusFilter,
  onViewRequest,
  onDeleteRequest,
}) {
  const { lang } = useLanguage();
  const t = (k) => ADMIN_T[lang][k];
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
            placeholder={t("searchRequests")}
            value={requestSearch}
            onChange={(e) => setRequestSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
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
                      {req.requestId}
                    </TableCell>
                    <TableCell className="max-w-[160px] text-sm">
                      {(() => {
                        const cfg = TYPE_CONFIG[getTypeKey(req)];
                        const title = cfg
                          ? cfg.getTitle(req)
                          : req.itemName || "—";
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
                      {req.requesterId?.personal_name || "N/A"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {req.requesterId?.department || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={urgencyVariant(req.urgency)}>
                        {req.urgency}
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
            {request?.requestId}
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
                value={request.requesterId?.personal_name}
              />
              <Detail
                label={t("fldDepartment")}
                value={request.requesterId?.department || "—"}
              />
            </div>

            {/* Purchase-specific fields */}
            {request.requestType === "PurchaseRequest" && (
              <div className="grid grid-cols-2 gap-3">
                <Detail label={t("fldItem")} value={request.itemName} />
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

            {request.approvalFlow?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {t("approvalFlow")}
                </p>
                <div className="space-y-2">
                  {request.approvalFlow.map((step, i) => (
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
