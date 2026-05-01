import React from "react";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";

// ─── Status / urgency badge variant helpers ────────────────────────────────
export const statusVariant = (s) =>
  s === "Approved" ? "success" : s === "Rejected" ? "destructive" : "warning";

export const urgencyVariant = (u) =>
  u === "High" ? "destructive" : u === "Medium" ? "warning" : "success";

export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ─── Field — labelled form row ─────────────────────────────────────────────
export function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ─── StatCard — single stat tile ──────────────────────────────────────────
export function StatCard({ icon, label, value, color, bg, border }) {
  return (
    <Card className={`border ${border}`}>
      <CardContent className="pt-4 pb-3 flex items-center gap-4">
        <span className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</span>
        <div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── TabButton ────────────────────────────────────────────────────────────
export function TabButton({ id, label, icon, activeTab, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}>
      {icon}
      {label}
    </button>
  );
}

// ─── Detail — read-only field row inside modal ─────────────────────────────
export function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-foreground mt-0.5">{value ?? "—"}</p>
    </div>
  );
}
