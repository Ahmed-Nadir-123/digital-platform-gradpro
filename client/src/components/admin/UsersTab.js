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
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Search,
  UserPlus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../../lib/LanguageContext";
import { ADMIN_T } from "./adminTranslations";
import { Field } from "./adminHelpers";
import { ROLES } from "../../hooks/useAdminDashboard";
import api from "../../lib/api";

// ─── UsersTab (S: renders users table + toolbar) ───────────────────────────
export function UsersTab({
  filteredUsers,
  usersLoading,
  userSearch,
  setUserSearch,
  updatingUser,
  updateUserInline,
  openCreateForm,
  openEditForm,
  onDeleteUser,
}) {
  const { lang } = useLanguage();
  const t = (k) => ADMIN_T[lang][k];
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchUsers")}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="sm" onClick={openCreateForm} className="shrink-0">
          <UserPlus className="h-4 w-4 mr-1.5" />
          {t("newUser")}
        </Button>
      </div>

      {usersLoading ? (
        <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("loadingUsers")}</span>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colName")}</TableHead>
                  <TableHead>{t("colEmail")}</TableHead>
                  <TableHead>{t("colStaffId")}</TableHead>
                  <TableHead>{t("colDept")}</TableHead>
                  <TableHead>{t("colRole")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8">
                      {t("noUsers")}
                    </TableCell>
                  </TableRow>
                )}
                {filteredUsers.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">
                      {u.personal_name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {u.staffId || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {u.department || "—"}
                    </TableCell>
                    <TableCell>
                      <select
                        value={u.role}
                        disabled={updatingUser === u._id}
                        onChange={(e) =>
                          updateUserInline(u._id, { role: e.target.value })
                        }
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50">
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "success" : "secondary"}>
                        {u.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => openEditForm(u)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          {t("btnEdit")}
                        </Button>
                        <button
                          onClick={() =>
                            updateUserInline(u._id, { isActive: !u.isActive })
                          }
                          disabled={updatingUser === u._id}
                          title={
                            u.isActive ? t("btnDeactivate") : t("btnActivate")
                          }
                          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
                          {updatingUser === u._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.isActive ? (
                            <>
                              <ToggleRight className="h-4 w-4 text-green-500" />
                              {t("btnDeactivate")}
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              {t("btnActivate")}
                            </>
                          )}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => onDeleteUser(u._id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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

// ─── UserFormModal (S: only handles create/edit user form) ─────────────────
export function UserFormModal({
  open,
  onOpenChange,
  editingUser,
  formData,
  formErrors,
  formSaving,
  setField,
  onSubmit,
}) {
  const { lang } = useLanguage();
  const t = (k) => ADMIN_T[lang][k];
  const [photoUploading, setPhotoUploading] = React.useState(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingUser) return;
    const fd = new FormData();
    fd.append("photo", file);
    setPhotoUploading(true);
    try {
      const { data } = await api.post(
        `/upload/profile/${editingUser._id}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setField("photoUrl", data.photoUrl);
      toast.success(lang === "ar" ? "تم رفع الصورة" : "Photo uploaded");
    } catch {
      toast.error(lang === "ar" ? "فشل رفع الصورة" : "Failed to upload photo");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? t("editUserTitle") : t("createUserTitle")}
          </DialogTitle>
          <DialogDescription>
            {editingUser ? t("editUserDesc") : t("createUserDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6 mt-2">
          {/* Photo upload — edit mode only */}
          {editingUser && (
            <div className="flex items-center gap-4">
              {formData.photoUrl ? (
                <img
                  src={`http://localhost:8080/${formData.photoUrl}`}
                  alt="profile"
                  className="h-14 w-14 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg font-semibold border border-border">
                  {formData.personal_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <label className="cursor-pointer">
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  {photoUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {lang === "ar"
                    ? "\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0635\u0648\u0631\u0629"
                    : "Change photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={photoUploading}
                />
              </label>
            </div>
          )}

          {/* Basic Info */}
          <fieldset>
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t("sectionBasic")}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("fStaffId")} required>
                <Input
                  value={formData.staffId}
                  onChange={(e) => setField("staffId", e.target.value)}
                  placeholder="EMP001"
                  className={formErrors.staffId ? "border-destructive" : ""}
                />
                {formErrors.staffId && (
                  <p className="text-xs text-destructive mt-0.5">
                    {t(formErrors.staffId)}
                  </p>
                )}
              </Field>
              <Field label={t("fFullName")} required>
                <Input
                  value={formData.personal_name}
                  onChange={(e) => setField("personal_name", e.target.value)}
                  placeholder="Ahmed Al-Rashidi"
                  className={
                    formErrors.personal_name ? "border-destructive" : ""
                  }
                />
                {formErrors.personal_name && (
                  <p className="text-xs text-destructive mt-0.5">
                    {t(formErrors.personal_name)}
                  </p>
                )}
              </Field>
              <Field label={t("fInitials")}>
                <Input
                  value={formData.initials}
                  onChange={(e) => setField("initials", e.target.value)}
                  placeholder="A.R."
                />
              </Field>
              <Field label={t("fEmail")} required>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="user@utas.edu.om"
                  className={formErrors.email ? "border-destructive" : ""}
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive mt-0.5">
                    {t(formErrors.email)}
                  </p>
                )}
              </Field>
              <Field
                label={editingUser ? t("fNewPass") : t("fPass")}
                required={!editingUser}>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder={
                    editingUser ? t("fNewPass") : "Min. 6 characters"
                  }
                  className={formErrors.password ? "border-destructive" : ""}
                />
                {formErrors.password && (
                  <p className="text-xs text-destructive mt-0.5">
                    {t(formErrors.password)}
                  </p>
                )}
              </Field>
            </div>
          </fieldset>

          {/* Contact & Work */}
          <fieldset>
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t("sectionContact")}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("fMobile")}>
                <Input
                  value={formData.mobile_number}
                  onChange={(e) => setField("mobile_number", e.target.value)}
                  placeholder="+968 9X XXX XXX"
                />
              </Field>
              <Field label={t("fDepartment")}>
                <Input
                  value={formData.department}
                  onChange={(e) => setField("department", e.target.value)}
                  placeholder="IT Department"
                />
              </Field>
              <Field label={t("fOffice")}>
                <Input
                  value={formData.office}
                  onChange={(e) => setField("office", e.target.value)}
                  placeholder="Room 101"
                />
              </Field>
              <Field label={t("fOfficeContact")}>
                <Input
                  value={formData.office_contact_number}
                  onChange={(e) =>
                    setField("office_contact_number", e.target.value)
                  }
                  placeholder="+968 24 XXX XXX"
                />
              </Field>
            </div>
          </fieldset>

          {/* Personal / ID */}
          <fieldset>
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t("sectionPersonal")}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("fNationalId")}>
                <Input
                  value={formData.national_id}
                  onChange={(e) => setField("national_id", e.target.value)}
                />
              </Field>
              <Field label={t("fManpowerId")}>
                <Input
                  value={formData.manpower_id}
                  onChange={(e) => setField("manpower_id", e.target.value)}
                />
              </Field>
              <Field label={t("fGender")}>
                <select
                  value={formData.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="">{t("optSelect")}</option>
                  <option value="Male">{t("optMale")}</option>
                  <option value="Female">{t("optFemale")}</option>
                </select>
              </Field>
              <Field label={t("fNationality")}>
                <Input
                  value={formData.nationality}
                  onChange={(e) => setField("nationality", e.target.value)}
                  placeholder="Omani"
                />
              </Field>
            </div>
          </fieldset>

          {/* Academic */}
          <fieldset>
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t("sectionAcademic")}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("fQualification")}>
                <Input
                  value={formData.academic_qualification}
                  onChange={(e) =>
                    setField("academic_qualification", e.target.value)
                  }
                  placeholder="Bachelor's"
                />
              </Field>
              <Field label={t("fYearIssue")}>
                <Input
                  type="number"
                  value={formData.year_of_issue}
                  onChange={(e) => setField("year_of_issue", e.target.value)}
                  placeholder="2020"
                />
              </Field>
              <Field label={t("fSpecialization")}>
                <Input
                  value={formData.specialization}
                  onChange={(e) => setField("specialization", e.target.value)}
                  placeholder="Computer Science"
                />
              </Field>
              <Field label={t("fUniversity")}>
                <Input
                  value={formData.name_of_university}
                  onChange={(e) =>
                    setField("name_of_university", e.target.value)
                  }
                  placeholder="Sultan Qaboos University"
                />
              </Field>
              <Field label={t("fCountryIssue")}>
                <Input
                  value={formData.country_of_issue}
                  onChange={(e) => setField("country_of_issue", e.target.value)}
                  placeholder="Oman"
                />
              </Field>
            </div>
          </fieldset>

          {/* System Settings */}
          <fieldset>
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t("sectionSystem")}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("fRole")} required>
                <select
                  value={formData.role}
                  onChange={(e) => setField("role", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("fStatus")}>
                <select
                  value={formData.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    setField("isActive", e.target.value === "active")
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="active">{t("optActive")}</option>
                  <option value="inactive">{t("optInactive")}</option>
                </select>
              </Field>
            </div>
          </fieldset>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={formSaving}>
              {t("btnCancel")}
            </Button>
            <Button type="submit" disabled={formSaving}>
              {formSaving && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              {editingUser ? t("btnSaveChanges") : t("btnCreateUser")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
