import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Loader2, Plus, Trash2, ShieldAlert, Tag } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

const T = {
  en: {
    title: "Role Management",
    subtitle: "Add or remove roles available for users. System roles are protected and cannot be deleted.",
    addRole: "Add Role",
    namePlaceholder: "Role name (e.g. supervisor)",
    labelPlaceholder: "Display label (optional)",
    systemBadge: "System",
    customBadge: "Custom",
    deleteConfirm: "Delete role",
    noRoles: "No roles found.",
    loading: "Loading roles…",
    errEmpty: "Role name cannot be empty.",
    usersCount: (n) => `${n} user${n !== 1 ? "s" : ""}`,
    nameTaken: "Role name already exists.",
  },
  ar: {
    title: "إدارة الأدوار",
    subtitle: "أضف أو احذف الأدوار المتاحة للمستخدمين. الأدوار الأساسية محمية ولا يمكن حذفها.",
    addRole: "إضافة دور",
    namePlaceholder: "اسم الدور (مثل: supervisor)",
    labelPlaceholder: "التسمية للعرض (اختياري)",
    systemBadge: "أساسي",
    customBadge: "مخصص",
    deleteConfirm: "حذف الدور",
    noRoles: "لا توجد أدوار.",
    loading: "جاري تحميل الأدوار…",
    errEmpty: "اسم الدور لا يمكن أن يكون فارغاً.",
    usersCount: (n) => `${n} مستخدم`,
    nameTaken: "اسم الدور موجود مسبقاً.",
  },
};

export function RolesTab({ roles, rolesLoading, users, onAddRole, onDeleteRole }) {
  const { lang } = useLanguage();
  const t = T[lang];
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [err, setErr] = useState("");

  const roleNames = roles.map((r) => r.name);

  const handleAdd = async () => {
    const trimmed = name.trim().toLowerCase().replace(/\s+/g, "_");
    if (!trimmed) { setErr(t.errEmpty); return; }
    if (roleNames.includes(trimmed)) { setErr(t.nameTaken); return; }
    setErr("");
    setSaving(true);
    await onAddRole(trimmed, label.trim());
    setSaving(false);
    setName("");
    setLabel("");
  };

  const handleDelete = async (roleName) => {
    setDeleting(roleName);
    await onDeleteRole(roleName);
    setDeleting(null);
  };

  // Count users per role
  const userCountByRole = {};
  for (const u of (users || [])) {
    const userRoles = Array.isArray(u.roles) ? u.roles : [];
    for (const r of userRoles) {
      userCountByRole[r] = (userCountByRole[r] || 0) + 1;
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">{t.subtitle}</p>

      {/* Add role form */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px] space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t.namePlaceholder}</label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(""); }}
              placeholder={t.namePlaceholder}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
          <div className="flex-1 min-w-[160px] space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t.labelPlaceholder}</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t.labelPlaceholder}
            />
          </div>
          <Button onClick={handleAdd} disabled={saving} size="sm" className="shrink-0 mb-0.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {t.addRole}
          </Button>
        </div>
      </Card>

      {/* Roles list */}
      {rolesLoading ? (
        <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t.loading}</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-10">{t.noRoles}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {roles.map((role) => {
            const count = userCountByRole[role.name] || 0;
            return (
              <Card key={role.name} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {role.isSystem
                    ? <ShieldAlert className="h-4 w-4 shrink-0 text-primary" />
                    : <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{role.name}</p>
                    {role.label && (
                      <p className="text-xs text-muted-foreground truncate">{role.label}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{t.usersCount(count)}</span>
                  <Badge variant={role.isSystem ? "secondary" : "outline"} className="text-[10px]">
                    {role.isSystem ? t.systemBadge : t.customBadge}
                  </Badge>
                  {!role.isSystem && (
                    <button
                      onClick={() => handleDelete(role.name)}
                      disabled={deleting === role.name}
                      title={t.deleteConfirm}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40">
                      {deleting === role.name
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
