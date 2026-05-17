import React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  UtensilsCrossed,
  Wallet,
  Printer,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { ADMIN_T } from "./adminTranslations";
import { statusVariant, formatDate } from "./adminHelpers";

const TYPE_META = {
  PurchaseRequest: {
    icon: Package,
    color: "bg-blue-100 text-blue-700",
    barColor: "bg-blue-500",
    keyLabel: "typePurchase",
  },
  TransportRequest: {
    icon: Truck,
    color: "bg-amber-100 text-amber-700",
    barColor: "bg-amber-500",
    keyLabel: "typeTransport",
  },
  FoodRequest: {
    icon: UtensilsCrossed,
    color: "bg-green-100 text-green-700",
    barColor: "bg-green-500",
    keyLabel: "typeFood",
  },
  FundRequest: {
    icon: Wallet,
    color: "bg-purple-100 text-purple-700",
    barColor: "bg-purple-500",
    keyLabel: "typeFund",
  },
  PrintingRequest: {
    icon: Printer,
    color: "bg-slate-100 text-slate-700",
    barColor: "bg-slate-500",
    keyLabel: "typePrinting",
  },
  RiskReport: {
    icon: AlertTriangle,
    color: "bg-red-100 text-red-700",
    barColor: "bg-red-500",
    keyLabel: "typeRisk",
  },
  InstallSoftwareRequest: {
    icon: Package,
    color: "bg-indigo-100 text-indigo-700",
    barColor: "bg-indigo-500",
    keyLabel: "typeInstallSoftware",
  },
};

function getRequestTitle(req) {
  return (
    req.itemDescription ||
    req.itemName ||
    req.destination ||
    req.occasionName ||
    req.fundPurpose ||
    req.purposeTitle ||
    req.softwareName ||
    req.examTitle ||
    req.documentType ||
    req.riskType ||
    req.type ||
    "—"
  );
}

// ─── OverviewTab (S: only renders the overview section) ───────────────────
export function OverviewTab({ stats, onGoToUsers, onGoToRequests }) {
  const { lang } = useLanguage();
  const t = (k) => ADMIN_T[lang][k];
  if (!stats) return null;

  const maxTotal = Math.max(
    ...(stats.typeBreakdown || []).map((x) => x.total),
    1,
  );

  return (
    <div className="space-y-5">
      {/* Users by Role */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground mb-3">
            {t("usersByRole")}
          </p>
          <div className="flex flex-wrap gap-3">
            {(stats.roleBreakdown || []).map((r) => (
              <div
                key={r._id}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground capitalize">
                  {r._id || "unknown"}
                </span>
                <Badge variant="secondary">{r.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requests by Type */}
      {stats.typeBreakdown?.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground mb-4">
              {t("requestsByType")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.typeBreakdown.map(
                ({ type, total, pending, approved, rejected }) => {
                  const meta = TYPE_META[type];
                  const Icon = meta?.icon || Package;
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-md ${meta?.color || "bg-gray-100 text-gray-700"}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {t(meta?.keyLabel) || type}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {total}
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${meta?.barColor || "bg-gray-400"} transition-all`}
                          style={{ width: `${(total / maxTotal) * 100}%` }}
                        />
                      </div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5 text-amber-500" />
                          {pending}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                          {approved}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <XCircle className="h-2.5 w-2.5 text-red-400" />
                          {rejected}
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground mb-3">
            {t("recentActivity")}
          </p>
          {!stats.recentRequests || stats.recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("noRecentActivity")}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentRequests.map((req) => {
                const meta = TYPE_META[req.requestType];
                const label = t(meta?.keyLabel) || req.requestType;
                return (
                  <div
                    key={req._id}
                    className="flex items-center justify-between py-2.5 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta?.color || "bg-gray-100 text-gray-700"}`}>
                        {label}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {getRequestTitle(req)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {req.requesterId?.fullName || req.requesterId?.personal_name || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <Badge
                        variant={statusVariant(req.status)}
                        className="text-[10px]">
                        {req.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground hidden sm:block">
                        {formatDate(req.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button size="sm" onClick={onGoToUsers}>
          <Users className="h-4 w-4 me-1.5" />
          {t("manageUsers")}
        </Button>
        <Button size="sm" variant="outline" onClick={onGoToRequests}>
          {t("switchHint")}{" "}
          <strong className="mx-1">{t("allRequestsLink")}</strong>{" "}
          {t("switchHint2")}
        </Button>
      </div>
    </div>
  );
}
