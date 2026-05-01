import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import DigitalRequests from "../employee/DigitalRequests";
import HandlerDashboard from "../handler/HandlerDashboard";
import AdminDashboard from "../admin/AdminDashboard";
import WorkflowDashboard from "../admin/WorkflowDashboard";
import TrackRequest from "../shared/TrackRequest";
import HelpDesk from "../shared/HelpDesk";
import NotificationBell from "../shared/NotificationBell";
import api from "../../lib/api";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, setUser, resetUser } from "../../Features/UserSlice";
import { useLanguage } from "../../lib/LanguageContext";
import { getTranslation } from "../employee/DigitalRequests.translations";
import logo from "../../Images/logo.png";
import {
  User,
  FileText,
  Mail,
  Cloud,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Languages,
  Search,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  Wrench,
  ExternalLink,
  GitBranch,
  Moon,
  Sun,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarSeparator,
} from "../ui/sidebar";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.users.user);
  const isSuccess = useSelector((state) => state.users.isSuccess);

  const getProfileImageUrl = (photoUrl) => {
    if (!photoUrl || photoUrl.trim() === "") {
      return "http://localhost:8080/uploads/profiles/default_avatar.png";
    }

    if (photoUrl.startsWith("http")) {
      return photoUrl;
    }
    return `http://localhost:8080/${photoUrl}`;
  };

  useEffect(() => {
    if (!isSuccess || !user) {
      navigate("/");
    }
  }, [isSuccess, user, navigate]);

  // Refresh the logged-in user's data on mount to pick up any changes
  // (e.g. profile photo updated by an admin)
  useEffect(() => {
    if (!user?._id) return;
    api
      .get(`/users/${user._id}`)
      .then(({ data }) => dispatch(setUser(data.user)))
      .catch(() => {}); // silently ignore — stale data is acceptable fallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const handleLogout = () => {
    dispatch(resetUser());
    dispatch(logout());
    navigate("/");
  };

  const {
    personal_name = "N/A",
    staffId,
    email = "N/A",
    mobile_number = "N/A",
    department = "N/A",
    office = "N/A",
    initials = "",
    academic_qualification = "N/A",
    specialization = "N/A",
    photoUrl = "",
    role,
  } = user || {};

  const displayId = staffId;

  // Role-based flags using the unified roles: "admin", "IT Staff", "employee"
  const isAdmin = role === "admin";
  const isHandler = role === "IT Staff";
  const isEmployee = !isAdmin && !isHandler; // "employee" or any legacy value

  const { lang, toggleLang, theme, toggleTheme } = useLanguage();
  const t = (key) => getTranslation(lang, key);

  const [activeSection, setActiveSection] = useState(
    isHandler ? "handler-dashboard" : isAdmin ? "admin-dashboard" : "employee",
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(isEmployee);
  const [handlerPendingCount, setHandlerPendingCount] = useState(0);

  const fetchStats = useCallback(async () => {
    if (!user?._id) return;

    if (isHandler) {
      try {
        const { data } = await api.get(`/requests/pending/${user._id}`);
        const count = Array.isArray(data)
          ? data.length
          : (data?.requests?.length ?? 0);
        setHandlerPendingCount(count);
      } catch {
        setHandlerPendingCount(0);
      }
      return;
    }

    if (isAdmin) {
      setHandlerPendingCount(0);
      return;
    }

    setStatsLoading(true);
    try {
      const { data } = await api.get(`/requests/my/${user._id}`);
      const list = data.requests ?? [];
      setStats({
        total: list.length,
        pending: list.filter((r) => r.status === "Pending").length,
        approved: list.filter((r) => r.status === "Approved").length,
        rejected: list.filter((r) => r.status === "Rejected").length,
      });
      setHandlerPendingCount(0);
    } catch {
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
      setHandlerPendingCount(0);
    } finally {
      setStatsLoading(false);
    }
  }, [user, isHandler, isAdmin]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const roleLabel = isAdmin
    ? t("roleAdmin")
    : isHandler
      ? t("roleItStaff")
      : t("roleEmployee");

  const mainGroupLabel = isAdmin
    ? t("navGroupManagement")
    : isHandler
      ? t("navGroupOperations")
      : t("navGroupServices");

  const externalLinks = [
    {
      label: "Outlook",
      url: "https://outlook.live.com",
      icon: <Mail className="h-4 w-4" />,
    },
    { label: "CIMS", url: "#", icon: <GraduationCap className="h-4 w-4" /> },
    {
      label: "OneDrive",
      url: "https://onedrive.live.com",
      icon: <Cloud className="h-4 w-4" />,
    },
  ];

  /* ── info row helper ── */
  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">
        {value || "N/A"}
      </span>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "employee":
        return (
          <div className="space-y-6 animate-in fade-in-0 duration-200">
            {/* ── Employee Info (top) ── */}
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Avatar + name */}
                  <div className="flex flex-col items-center gap-2 sm:w-36 shrink-0">
                    <Avatar className="h-20 w-20">
                      {photoUrl ? (
                        <AvatarImage
                          src={getProfileImageUrl(photoUrl)}
                          alt={personal_name}
                          onError={(e) => {
                            e.target.src =
                              "http://localhost:8080/uploads/profiles/default_avatar.png";
                          }}
                        />
                      ) : null}
                      <AvatarFallback className="text-xl">
                        {initials || personal_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="font-semibold text-sm text-foreground leading-tight">
                        {personal_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {department}
                      </p>
                      <Badge variant="success" className="mt-1.5 text-xs">
                        {t("active")}
                      </Badge>
                    </div>
                  </div>

                  <Separator
                    orientation="vertical"
                    className="hidden sm:block self-stretch"
                  />
                  <Separator className="sm:hidden" />

                  {/* Key details grid */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    <InfoRow label={t("staffId")} value={displayId} />
                    <InfoRow label={t("emailLabel")} value={email} />
                    <InfoRow label={t("mobile")} value={mobile_number} />
                    <InfoRow label={t("department")} value={department} />
                    <InfoRow label={t("officeDetails")} value={office} />
                    <InfoRow
                      label={t("education")}
                      value={
                        academic_qualification !== "N/A"
                          ? `${academic_qualification}${specialization !== "N/A" ? ` — ${specialization}` : ""}`
                          : "N/A"
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Stats ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {statsLoading
                  ? t("loadingStats")
                  : t("totalRequests") + `: ${stats?.total ?? 0}`}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    icon: <ClipboardList className="h-5 w-5" />,
                    color: "text-primary",
                    bg: "bg-primary/8",
                    border: "border-primary/15",
                    label: t("totalRequests"),
                    val: stats?.total ?? 0,
                  },
                  {
                    icon: <Clock className="h-5 w-5" />,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    label: t("pendingRequests"),
                    val: stats?.pending ?? 0,
                  },
                  {
                    icon: <CheckCircle2 className="h-5 w-5" />,
                    color: "text-green-600",
                    bg: "bg-green-50",
                    border: "border-green-200",
                    label: t("approvedRequests"),
                    val: stats?.approved ?? 0,
                  },
                  {
                    icon: <XCircle className="h-5 w-5" />,
                    color: "text-red-500",
                    bg: "bg-red-50",
                    border: "border-red-200",
                    label: t("rejectedRequests"),
                    val: stats?.rejected ?? 0,
                  },
                ].map(({ icon, color, bg, border, label, val }) => (
                  <Card key={label} className={`border ${border}`}>
                    <CardContent className="pt-4 pb-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className={`p-1.5 rounded-md ${bg} ${color}`}>
                          {icon}
                        </span>
                        {statsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <span className={`text-2xl font-bold ${color}`}>
                            {val}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {label}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {t("quickActions")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveSection("digital-requests")}
                  className="group text-start rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="font-semibold text-sm text-foreground">
                    {t("newRequest")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t("newRequestDesc")}
                  </p>
                </button>

                <button
                  onClick={() => setActiveSection("track-request")}
                  className="group text-start rounded-xl border border-border bg-card p-4 hover:border-amber-400/40 hover:bg-amber-50/50 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-lg bg-amber-100 text-amber-600">
                      <Search className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="font-semibold text-sm text-foreground">
                    {t("trackRequests")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t("trackRequestsDesc")}
                  </p>
                </button>
              </div>
            </div>
          </div>
        );

      case "digital-requests":
        return (
          <div className="animate-in fade-in-0 duration-200">
            <DigitalRequests />
          </div>
        );

      case "help-desk":
        return (
          <div className="animate-in fade-in-0 duration-200">
            <HelpDesk />
          </div>
        );

      case "track-request":
        return (
          <div className="animate-in fade-in-0 duration-200">
            <TrackRequest />
          </div>
        );

      case "handler-dashboard":
        return (
          <div className="animate-in fade-in-0 duration-200">
            <HandlerDashboard />
          </div>
        );

      case "admin-dashboard":
        return (
          <div className="animate-in fade-in-0 duration-200">
            <AdminDashboard />
          </div>
        );

      case "workflow-dashboard":
        return (
          <div className="animate-in fade-in-0 duration-200">
            <WorkflowDashboard />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ── Top Navbar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            className="md:hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar">
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
          <span className="font-semibold text-foreground text-sm">
            {t("portalTitle")} &mdash; {personal_name}
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <NotificationBell userId={user?._id} />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <button
            onClick={toggleTheme}
            title={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <button
            onClick={toggleLang}
            title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">{t("langToggle")}</span>
          </button>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t("logout")}</span>
          </button>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar overlay on mobile ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed inset-y-0 start-0 z-30 flex flex-col w-64 bg-[hsl(var(--sidebar))] pt-14
            transition-transform duration-200 ease-in-out
            md:static md:translate-x-0 md:pt-0
            ${
              sidebarOpen
                ? "translate-x-0"
                : lang === "ar"
                  ? "translate-x-full md:translate-x-0"
                  : "-translate-x-full md:translate-x-0"
            }
          `}>
          {/* ── User Profile Header ── */}
          <div className="shrink-0 px-4 py-4 border-b border-[hsl(var(--sidebar-foreground)/0.1)]">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/10">
                {photoUrl ? (
                  <AvatarImage
                    src={getProfileImageUrl(photoUrl)}
                    alt={personal_name}
                    onError={(e) => {
                      e.target.src =
                        "http://localhost:8080/uploads/profiles/default_avatar.png";
                    }}
                  />
                ) : null}
                <AvatarFallback className="text-sm font-bold bg-[hsl(var(--sidebar-active))] text-white">
                  {initials || personal_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {personal_name}
                </p>
                <p className="text-[11px] truncate mt-0.5 text-[hsl(var(--sidebar-foreground)/0.55)]">
                  {department}
                </p>
                <span className="inline-flex mt-1.5 items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-white/10 text-[hsl(var(--sidebar-foreground)/0.8)]">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* ── Navigation ── */}
          <nav className="flex-1 overflow-y-auto px-2 py-2">
            {/* Group: My Account */}
            <SidebarGroup>
              <SidebarGroupLabel>{t("navGroupAccount")}</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeSection === "employee"}
                    onClick={() => {
                      setActiveSection("employee");
                      setSidebarOpen(false);
                    }}>
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t("menuEmployee")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Group: Role-specific navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>{mainGroupLabel}</SidebarGroupLabel>
              <SidebarMenu>
                {isEmployee && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeSection === "digital-requests"}
                        onClick={() => {
                          setActiveSection("digital-requests");
                          setSidebarOpen(false);
                        }}>
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{t("menuServices")}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeSection === "track-request"}
                        onClick={() => {
                          setActiveSection("track-request");
                          setSidebarOpen(false);
                        }}>
                        <Search className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {t("menuTrackRequest")}
                        </span>
                        {!statsLoading && stats?.pending > 0 && (
                          <SidebarMenuBadge>{stats.pending}</SidebarMenuBadge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeSection === "help-desk"}
                        onClick={() => {
                          setActiveSection("help-desk");
                          setSidebarOpen(false);
                        }}>
                        <Wrench className="h-4 w-4 shrink-0" />
                        <span className="truncate">{t("menuHelpDesk")}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                {isHandler && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "handler-dashboard"}
                      onClick={() => {
                        setActiveSection("handler-dashboard");
                        setSidebarOpen(false);
                      }}>
                      <Wrench className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {t("menuHandlerDashboard")}
                      </span>
                      {handlerPendingCount > 0 && (
                        <SidebarMenuBadge>
                          {handlerPendingCount}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "admin-dashboard"}
                      onClick={() => {
                        setActiveSection("admin-dashboard");
                        setSidebarOpen(false);
                      }}>
                      <ClipboardList className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {t("menuAdminDashboard")}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "workflow-dashboard"}
                      onClick={() => {
                        setActiveSection("workflow-dashboard");
                        setSidebarOpen(false);
                      }}>
                      <GitBranch className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {t("menuWorkflowDashboard")}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "digital-requests"}
                      onClick={() => {
                        setActiveSection("digital-requests");
                        setSidebarOpen(false);
                      }}>
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t("menuServices")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "track-request"}
                      onClick={() => {
                        setActiveSection("track-request");
                        setSidebarOpen(false);
                      }}>
                      <Search className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t("menuTrackRequest")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Group: Quick Links */}
            <SidebarGroup>
              <SidebarGroupLabel>{t("navGroupLinks")}</SidebarGroupLabel>
              <SidebarMenu>
                {externalLinks.map((link, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuButton href={link.url} external>
                      {link.icon}
                      <span className="truncate">{link.label}</span>
                      <ExternalLink className="ms-auto h-3 w-3 shrink-0 opacity-40" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </nav>

          {/* ── Footer: Logout ── */}
          <div className="shrink-0 border-t border-[hsl(var(--sidebar-foreground)/0.1)] px-2 py-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="text-red-400/80 hover:bg-red-900/20 hover:text-red-300">
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>{t("logout")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Home;
