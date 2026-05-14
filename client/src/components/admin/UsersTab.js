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
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../../lib/LanguageContext";
import { ADMIN_T } from "./adminTranslations";
import { Field } from "./adminHelpers";

// ─── RoleChipPicker ────────────────────────────────────────────────────────
function RoleChipPicker({ value, onChange, roles = [] }) {
  const selected = Array.isArray(value) ? value : (typeof value === "string" && value ? value.split(",").map(r => r.trim()).filter(Boolean) : []);
  const toggle = (role) => {
    const next = selected.includes(role) ? selected.filter(r => r !== role) : [...selected, role];
    onChange(next);
  };
  const allRoleNames = roles.map(r => r.name || r);
  return (
    <div className="space-y-2">
      {/* Available roles */}
      <div className="flex flex-wrap gap-1.5">
        {allRoleNames.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => toggle(r)}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
              selected.includes(r)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
            }`}>
            {r}
          </button>
        ))}
      </div>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
          {selected.map((r) => (
            <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {r}
              <button type="button" onClick={() => toggle(r)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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
  uploadUserPhoto,
  roles,
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
                      {u.fullName || u.personal_name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {u.staffId || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {u.departmentRef?.departmentName || u.department || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(u.roles) && u.roles.length > 0
                          ? u.roles.map((r) => (
                              <span key={r} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">{r}</span>
                            ))
                          : <span className="text-xs text-muted-foreground">{u.role || "—"}</span>
                        }
                      </div>
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
  uploadUserPhoto,
  roles,
  departments,
}) {
  const { lang } = useLanguage();
  const t = (k) => ADMIN_T[lang][k];
  const [photoUploading, setPhotoUploading] = React.useState(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingUser) return;
    setPhotoUploading(true);
    try {
      const data = await uploadUserPhoto(editingUser._id, file);
      setField("photoUrl", data.photoUrl);
      toast.success(lang === "ar" ? "تم رفع الصورة" : "Photo uploaded");
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || (lang === "ar" ? "فشل رفع الصورة" : "Failed to upload photo");
      toast.error(msg);
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
          {/* Photo upload — edit mode; create mode shows note */}
          {editingUser ? (
            <div className="flex items-center gap-4">
              {formData.photoUrl ? (
                <img
                  src={
                    formData.photoUrl.startsWith("http")
                      ? formData.photoUrl
                      : `${process.env.REACT_APP_API_URL || "http://localhost:8080"}/${formData.photoUrl}`
                  }
                  alt="profile"
                  className="h-14 w-14 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg font-semibold border border-border">
                  {formData.fullName?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <label className="cursor-pointer">
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  {photoUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {lang === "ar" ? "تغيير الصورة" : "Change photo"}
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
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              <Upload className="h-4 w-4 shrink-0" />
              {lang === "ar"
                ? "يمكن إضافة الصورة بعد إنشاء المستخدم"
                : "Profile photo can be uploaded after creating the user"}
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
                  value={formData.fullName || formData.personal_name}
                  onChange={(e) => {
                    setField("fullName", e.target.value);
                    setField("personal_name", e.target.value);
                  }}
                  placeholder="Ahmed Al-Rashidi"
                  className={
                    formErrors.fullName || formErrors.personal_name
                      ? "border-destructive"
                      : ""
                  }
                />
                {(formErrors.fullName || formErrors.personal_name) && (
                  <p className="text-xs text-destructive mt-0.5">
                    {t(formErrors.fullName || formErrors.personal_name)}
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
                  value={formData.mobileNumber || formData.mobile_number}
                  onChange={(e) => {
                    setField("mobileNumber", e.target.value);
                    setField("mobile_number", e.target.value);
                  }}
                  placeholder="+968 9X XXX XXX"
                />
              </Field>
              <Field label={t("fDepartment")}>
                <select
                  value={formData.departmentRef || ""}
                  onChange={(e) => setField("departmentRef", e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">{lang === "ar" ? "اختر القسم" : "Select department"}</option>
                  {(departments || []).map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
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
                  value={
                    formData.officeContactNumber || formData.office_contact_number
                  }
                  onChange={(e) => {
                    setField("officeContactNumber", e.target.value);
                    setField("office_contact_number", e.target.value);
                  }}
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
                  value={formData.nationalId || formData.national_id}
                  onChange={(e) => {
                    setField("nationalId", e.target.value);
                    setField("national_id", e.target.value);
                  }}
                />
              </Field>
              <Field label={t("fManpowerId")}>
                <Input
                  value={formData.manpowerId || formData.manpower_id}
                  onChange={(e) => {
                    setField("manpowerId", e.target.value);
                    setField("manpower_id", e.target.value);
                  }}
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
                  value={
                    formData.academicQualification ||
                    formData.academic_qualification
                  }
                  onChange={(e) => {
                    setField("academicQualification", e.target.value);
                    setField("academic_qualification", e.target.value);
                  }}
                  placeholder="Bachelor's"
                />
              </Field>
              <Field label={t("fYearIssue")}>
                <Input
                  type="number"
                  value={formData.yearOfIssue || formData.year_of_issue}
                  onChange={(e) => {
                    setField("yearOfIssue", e.target.value);
                    setField("year_of_issue", e.target.value);
                  }}
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
              <Field label={t("fCountryIssue")}>
                <Input
                  value={formData.countryOfIssue || formData.country_of_issue}
                  onChange={(e) => {
                    setField("countryOfIssue", e.target.value);
                    setField("country_of_issue", e.target.value);
                  }}
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
            <div className="grid grid-cols-1 gap-3">
              <Field label={t("fRoles") || "Roles"} required>
                <RoleChipPicker
                  value={formData.roles}
                  onChange={(next) => setField("roles", next)}
                  roles={roles}
                />
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
