/**
 * SingleLevelRequests.js
 * Forms for requests assigned directly to a single handler:
 *  - Software Installation Request
 *  - Printing Request (Exam Paper / Official Certificate)
 *  - Risk / Hazard Report
 */
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createInstallSoftwareRequest,
  createPrintingRequest,
  createRiskRequest,
} from "../../Features/DigitalRequestSlice";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { useLanguage } from "../../lib/LanguageContext";
import toast from "react-hot-toast";
import {
  Laptop,
  Printer,
  AlertTriangle,
  Send,
  Loader2,
  ArrowLeft,
  FileText,
  Trophy,
  Upload,
  CheckCircle2,
  X,
} from "lucide-react";

/* ─── translations ─────────────────────────────────────────────────────────── */
const T = {
  en: {
    title: "Direct Service Requests",
    subtitle: "Requests assigned directly to a service handler",
    softwareTab: "Software Install",
    printingTab: "Printing",
    riskTab: "Risk Report",
    optional: "Optional",
    submitting: "Submitting…",
    required: "*",

    /* Software Install */
    softwareTitle: "Software Installation Request",
    softwareNameLabel: "Software Name",
    softwareNamePlaceholder:
      "e.g., MATLAB R2024a, Adobe Acrobat Pro, AutoCAD 2025…",
    installLocationLabel: "Installation Location",
    installLocationPlaceholder:
      "e.g., Lab 3 Building B, Room 204, My office PC",
    softwareVersionLabel: "Software Version",
    softwareVersionPlaceholder: "e.g., 2024a, Pro 2025, v23.1",
    licenseTypeLabel: "License Type",
    licenseSelect: "— Select license type —",
    licenseTypePerpetual: "Perpetual",
    licenseTypeAnnual: "Annual Subscription",
    licenseTypeEducational: "Educational",
    licenseTypeTrial: "Trial / Evaluation",
    operatingSystemLabel: "Operating System",
    osSelect: "— Select OS —",
    osWindows: "Windows",
    osMac: "macOS",
    osLinux: "Linux",
    machineIdLabel: "Machine / PC Identifier",
    machineIdPlaceholder: "e.g., PC-IT-023, Lab3-PC5",
    preferredDateLabel: "Preferred Installation Date",
    priorityLabel: "Priority",
    priorityLow: "Low",
    priorityMedium: "Medium",
    priorityHigh: "High",
    descriptionLabel: "Description / Additional Requirements",
    descriptionPlaceholder:
      "Specific requirements, permissions needed, or other details…",
    submitSoftware: "Submit Software Request",

    /* Printing */
    printingTitle: "Printing Request",
    chooseDocType: "Select Document Type",
    examPaper: "Exam Question Paper",
    officialCert: "Official Certificate",
    backToTypes: "Back to Types",
    courseNameLabel: "Course Name",
    courseNamePlaceholder: "e.g., Introduction to Programming",
    courseCodeLabel: "Course Code",
    courseCodePlaceholder: "e.g., CS101",
    examTitleLabel: "Exam Title",
    examTitlePlaceholder: "e.g., Midterm Exam, Final Exam",
    requiredDateLabel: "Required By Date",
    orientationLabel: "Printing Orientation",
    singleSided: "Single Sided",
    doubleSided: "Double Sided",
    colorLabel: "Color",
    colorSelect: "— Select color —",
    colorFull: "Full Color",
    colorBW: "Black & White",
    staplingLabel: "Stapling",
    staplingSelect: "— Select —",
    staplingYes: "Yes",
    staplingNo: "No",
    paperSizeLabel: "Paper Size",
    paperSizeSelect: "— Select size —",
    paperA4: "A4",
    paperA3: "A3",
    paperLetter: "Letter",
    pagesPerExamLabel: "Pages per Exam",
    pagesPlaceholder: "e.g., 4",
    setsCountLabel: "Number of Sets / Copies",
    setsPlaceholder: "e.g., 60",
    totalPagesLabel: "Total Pages (auto-calculated)",
    eventNameLabel: "Event / Ceremony Name",
    eventNamePlaceholder: "e.g., Graduation Ceremony 2025",
    numCertificatesLabel: "Number of Certificates",
    numCertPlaceholder: "e.g., 45",
    certTypeLabel: "Certificate Type",
    certSelect: "— Select type —",
    certGraduation: "Graduation",
    certAchievement: "Achievement",
    certParticipation: "Participation",
    certOther: "Other",
    uploadDocLabel: "Upload Document",
    uploadDocSubtitle: "PDF or Word documents (max 10 MB)",
    uploadHint: "Click to upload or drag and drop",
    printingNotice: "Important Notice",
    noticeItem1: "The requester must provide the document in PDF or hardcopy format.",
    noticeItem2: "The requester must be present during the printing process.",
    noticeItem3: "Printing must be arranged at least one day before the exam.",
    submitPrinting: "Submit Printing Request",

    /* Risk Report */
    riskTitle: "Risk / Hazard Report",
    locationLabel: "Location of Risk",
    locationPlaceholder: "e.g., Lab 2, Building C, Parking Area",
    riskTypeLabel: "Risk Type",
    riskSelect: "— Select risk type —",
    riskElectrical: "Electrical",
    riskFire: "Fire Hazard",
    riskSafety: "Safety Obstruction",
    riskFacility: "Facility Damage",
    riskChemical: "Chemical Hazard",
    riskCompliance: "Compliance",
    riskOther: "Other",
    descRiskLabel: "Description",
    descRiskPlaceholder: "Describe the observed risk in detail…",
    severityLabel: "Severity",
    severitySelect: "— Select severity —",
    severityLow: "Low",
    severityMedium: "Medium",
    severityHigh: "High",
    severityCritical: "Critical",
    likelihoodLabel: "Likelihood",
    likelihoodSelect: "— Select likelihood —",
    likelihoodRare: "Rare",
    likelihoodUnlikely: "Unlikely",
    likelihoodPossible: "Possible",
    likelihoodLikely: "Likely",
    likelihoodAlmost: "Almost Certain",
    incidentDateLabel: "Incident / Observation Date",
    riskAssessmentLabel: "Risk Assessment Notes",
    riskAssessmentPlaceholder: "Your assessment of the potential impact…",
    mitigationLabel: "Suggested Mitigation Actions",
    mitigationPlaceholder: "Steps you recommend to resolve this risk…",
    submitRisk: "Submit Risk Report",
    riskPriorityLabel: "Priority",
    recipientNameLabel: "Recipient Name",
    recipientNamePlaceholder: "e.g., Ahmed Al-Farsi",
    uploadRecipientsLabel: "Recipients List",
    uploadRecipientsSubtitle: "CSV, Excel, Word, PDF or TXT (max 10 MB)",

    /* Errors */
    errSoftware: "Software name and installation location are required.",
    errPrintDocType: "Please choose a document type.",
    errPrintFile: "Please upload your document file.",
    errPrintFields: "Please fill in all required printing fields.",
    errRisk: "Location, risk type, description and severity are required.",
    errGeneral: "Failed to submit. Please try again.",
  },
  ar: {
    title: "طلبات الخدمة المباشرة",
    subtitle: "طلبات تُسند مباشرةً إلى مسؤول الخدمة",
    softwareTab: "تثبيت برنامج",
    printingTab: "طباعة",
    riskTab: "بلاغ مخاطر",
    optional: "اختياري",
    submitting: "جارٍ الإرسال…",
    required: "*",

    /* Software Install */
    softwareTitle: "طلب تثبيت برنامج",
    softwareNameLabel: "اسم البرنامج",
    softwareNamePlaceholder:
      "مثال: MATLAB R2024a، Adobe Acrobat Pro، AutoCAD 2025…",
    installLocationLabel: "موقع التثبيت",
    installLocationPlaceholder: "مثال: مختبر 3 المبنى ب، قاعة 204، جهازي في المكتب",
    softwareVersionLabel: "إصدار البرنامج",
    softwareVersionPlaceholder: "مثال: 2024a, Pro 2025, v23.1",
    licenseTypeLabel: "نوع الترخيص",
    licenseSelect: "— اختر نوع الترخيص —",
    licenseTypePerpetual: "دائم",
    licenseTypeAnnual: "اشتراك سنوي",
    licenseTypeEducational: "تعليمي",
    licenseTypeTrial: "تجريبي",
    operatingSystemLabel: "نظام التشغيل",
    osSelect: "— اختر نظام التشغيل —",
    osWindows: "ويندوز",
    osMac: "macOS",
    osLinux: "لينكس",
    machineIdLabel: "معرّف الجهاز",
    machineIdPlaceholder: "مثال: PC-IT-023, Lab3-PC5",
    preferredDateLabel: "تاريخ التثبيت المفضل",
    priorityLabel: "الأولوية",
    priorityLow: "منخفض",
    priorityMedium: "متوسط",
    priorityHigh: "مرتفع",
    descriptionLabel: "الوصف / المتطلبات الإضافية",
    descriptionPlaceholder: "متطلبات خاصة، صلاحيات مطلوبة، أو تفاصيل أخرى…",
    submitSoftware: "إرسال طلب البرنامج",

    /* Printing */
    printingTitle: "طلب طباعة",
    chooseDocType: "اختر نوع المستند",
    examPaper: "ورقة امتحان",
    officialCert: "شهادة رسمية",
    backToTypes: "العودة للأنواع",
    courseNameLabel: "اسم المادة",
    courseNamePlaceholder: "مثال: مقدمة في البرمجة",
    courseCodeLabel: "رمز المادة",
    courseCodePlaceholder: "مثال: CS101",
    examTitleLabel: "عنوان الامتحان",
    examTitlePlaceholder: "مثال: امتحان منتصف الفصل، امتحان النهائي",
    requiredDateLabel: "تاريخ الحاجة إليه",
    orientationLabel: "اتجاه الطباعة",
    singleSided: "وجه واحد",
    doubleSided: "وجهان",
    colorLabel: "الألوان",
    colorSelect: "— اختر نوع الألوان —",
    colorFull: "ألوان كاملة",
    colorBW: "أبيض وأسود",
    staplingLabel: "التدبيس",
    staplingSelect: "— اختر —",
    staplingYes: "نعم",
    staplingNo: "لا",
    paperSizeLabel: "حجم الورق",
    paperSizeSelect: "— اختر الحجم —",
    paperA4: "A4",
    paperA3: "A3",
    paperLetter: "Letter",
    pagesPerExamLabel: "عدد الصفحات لكل امتحان",
    pagesPlaceholder: "مثال: 4",
    setsCountLabel: "عدد النسخ",
    setsPlaceholder: "مثال: 60",
    totalPagesLabel: "إجمالي الصفحات (محسوب تلقائياً)",
    eventNameLabel: "اسم الفعالية / الحفل",
    eventNamePlaceholder: "مثال: حفل التخرج 2025",
    numCertificatesLabel: "عدد الشهادات",
    numCertPlaceholder: "مثال: 45",
    certTypeLabel: "نوع الشهادة",
    certSelect: "— اختر النوع —",
    certGraduation: "تخرج",
    certAchievement: "تفوق",
    certParticipation: "مشاركة",
    certOther: "أخرى",
    uploadDocLabel: "رفع المستند",
    uploadDocSubtitle: "ملفات PDF أو Word (الحد الأقصى 10 ميجابايت)",
    uploadHint: "انقر للرفع أو اسحب وأفلت",
    printingNotice: "تنبيه مهم",
    noticeItem1: "يجب على مقدم الطلب توفير المستند بصيغة PDF أو ورقياً.",
    noticeItem2: "يجب على مقدم الطلب الحضور أثناء عملية الطباعة.",
    noticeItem3: "يجب ترتيب الطباعة قبل يوم واحد على الأقل من الامتحان.",
    submitPrinting: "إرسال طلب الطباعة",

    /* Risk Report */
    riskTitle: "بلاغ مخاطر",
    locationLabel: "موقع الخطر",
    locationPlaceholder: "مثال: مختبر 2، المبنى ج، موقف السيارات",
    riskTypeLabel: "نوع الخطر",
    riskSelect: "— اختر نوع الخطر —",
    riskElectrical: "كهربائي",
    riskFire: "خطر حريق",
    riskSafety: "عائق أمني",
    riskFacility: "تلف في المرافق",
    riskChemical: "خطر كيميائي",
    riskCompliance: "امتثال",
    riskOther: "أخرى",
    descRiskLabel: "الوصف",
    descRiskPlaceholder: "صف الخطر المُلاحَظ بالتفصيل…",
    severityLabel: "درجة الخطورة",
    severitySelect: "— اختر درجة الخطورة —",
    severityLow: "منخفضة",
    severityMedium: "متوسطة",
    severityHigh: "عالية",
    severityCritical: "حرجة",
    likelihoodLabel: "احتمالية الحدوث",
    likelihoodSelect: "— اختر الاحتمالية —",
    likelihoodRare: "نادر",
    likelihoodUnlikely: "غير مرجح",
    likelihoodPossible: "محتمل",
    likelihoodLikely: "مرجح",
    likelihoodAlmost: "شبه مؤكد",
    incidentDateLabel: "تاريخ الحادثة / الملاحظة",
    riskAssessmentLabel: "ملاحظات تقييم المخاطر",
    riskAssessmentPlaceholder: "تقييمك للتأثير المحتمل…",
    mitigationLabel: "إجراءات التخفيف المقترحة",
    mitigationPlaceholder: "الخطوات التي توصي بها لحل هذه المشكلة…",
    submitRisk: "إرسال بلاغ المخاطر",
    riskPriorityLabel: "الأولوية",
    recipientNameLabel: "اسم المستلم",
    recipientNamePlaceholder: "مثال: أحمد الفارسي",
    uploadRecipientsLabel: "ملف قائمة المستلمين",
    uploadRecipientsSubtitle: "CSV أو Excel أو Word أو PDF أو TXT (الحد الأقصى 10 ميجابايت)",

    /* Errors */
    errSoftware: "اسم البرنامج وموقع التثبيت مطلوبان.",
    errPrintDocType: "يرجى اختيار نوع المستند.",
    errPrintFile: "يرجى رفع ملف المستند.",
    errPrintFields: "يرجى ملء جميع حقول الطباعة المطلوبة.",
    errRisk: "الموقع ونوع الخطر والوصف ودرجة الخطورة مطلوبة.",
    errGeneral: "فشل الإرسال. يرجى المحاولة مرة أخرى.",
  },
};

/* ─── component ─────────────────────────────────────────────────────────────── */
const SingleLevelRequests = () => {
  const { lang } = useLanguage();
  const t = T[lang] || T.en;
  const isRTL = lang === "ar";

  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.digitalRequests);
  const user = useSelector((state) => state.users.user);

  const [activeTab, setActiveTab] = useState("software");

  /* ── Software state ── */
  const [software, setSoftware] = useState({
    softwareName: "",
    installationLocation: "",
    softwareVersion: "",
    licenseType: "",
    operatingSystem: "",
    machineIdentifier: "",
    preferredInstallationDate: "",
    priority: "medium",
    description: "",
  });

  /* ── Printing state ── */
  const [printDocType, setPrintDocType] = useState(""); // "exam-paper" | "official-cert" | ""
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [uploadedRecipientsList, setUploadedRecipientsList] = useState(null);
  const [recipientsListError, setRecipientsListError] = useState("");
  const [printing, setPrinting] = useState({
    /* shared */
    requiredDate: "",
    orientation: "Single Sided",
    color: "",
    stapling: "",
    paperSize: "",
    /* exam-paper */
    courseName: "",
    courseCode: "",
    examTitle: "",
    pagesPerExam: "",
    setsCount: "",
    /* official-cert */
    eventName: "",
    numberOfCertificates: "",
    certificateType: "",
    recipientName: "",
  });

  const totalPages =
    printing.pagesPerExam && printing.setsCount
      ? Number(printing.pagesPerExam) * Number(printing.setsCount)
      : 0;

  /* ── Risk state ── */
  const [risk, setRisk] = useState({
    location: "",
    riskType: "",
    description: "",
    severity: "",
    likelihood: "",
    priority: "medium",
    incidentDate: "",
    riskAssessment: "",
    mitigationActions: "",
  });

  /* ── File upload handler ── */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFileError("");
    if (!file) return;
    const validExtensions = [".pdf", ".doc", ".docx"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setFileError(
        isRTL
          ? "يرجى رفع ملف PDF أو Word (.pdf, .doc, .docx)"
          : "Please upload a PDF or Word document (.pdf, .doc, .docx)",
      );
      setUploadedFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError(
        isRTL
          ? "حجم الملف يجب أن يكون أقل من 10 ميجابايت"
          : "File size must be less than 10 MB",
      );
      setUploadedFile(null);
      return;
    }
    setUploadedFile(file);
  };

  /* ── Recipients list upload handler ── */
  const handleRecipientsListUpload = (e) => {
    const file = e.target.files[0];
    setRecipientsListError("");
    if (!file) return;
    const validExtensions = [".csv", ".xlsx", ".xls", ".txt", ".pdf", ".doc", ".docx"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setRecipientsListError(
        isRTL
          ? "يرجى رفع ملف CSV أو Excel أو Word أو PDF أو TXT"
          : "Please upload a CSV, Excel, Word, PDF, or TXT file",
      );
      setUploadedRecipientsList(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setRecipientsListError(
        isRTL
          ? "حجم الملف يجب أن يكون أقل من 10 ميجابايت"
          : "File size must be less than 10 MB",
      );
      setUploadedRecipientsList(null);
      return;
    }
    setUploadedRecipientsList(file);
  };

  /* ── Submit: Software ── */
  const onSubmitSoftware = async (e) => {
    e.preventDefault();
    if (!software.softwareName || !software.installationLocation) {
      toast.error(t.errSoftware);
      return;
    }
    try {
      const result = await dispatch(
        createInstallSoftwareRequest({
          requesterId: user._id,
          softwareName: software.softwareName,
          installationLocation: software.installationLocation,
          softwareVersion: software.softwareVersion,
          licenseType: software.licenseType,
          operatingSystem: software.operatingSystem,
          machineIdentifier: software.machineIdentifier,
          preferredInstallationDate: software.preferredInstallationDate || null,
          priority: software.priority,
          description: software.description,
        }),
      );
      if (result.type === "digitalRequests/createInstallSoftware/fulfilled") {
        toast.success(
          `✓ Request submitted — ID: ${result.payload?.requestId || result.payload?.requestNumber}`,
        );
        setSoftware({
          softwareName: "",
          installationLocation: "",
          softwareVersion: "",
          licenseType: "",
          operatingSystem: "",
          machineIdentifier: "",
          preferredInstallationDate: "",
          priority: "medium",
          description: "",
        });
      } else {
        toast.error(result.payload || t.errGeneral);
      }
    } catch {
      toast.error(t.errGeneral);
    }
  };

  /* ── Submit: Printing ── */
  const onSubmitPrinting = async (e) => {
    e.preventDefault();
    if (!printDocType) {
      toast.error(t.errPrintDocType);
      return;
    }
    if (!uploadedFile) {
      toast.error(t.errPrintFile);
      return;
    }
    if (printDocType === "exam-paper" && (!printing.pagesPerExam || !printing.setsCount)) {
      toast.error(t.errPrintFields);
      return;
    }
    if (printDocType === "official-cert" && !printing.numberOfCertificates) {
      toast.error(t.errPrintFields);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("requesterId", user._id);
      formData.append("type", printDocType);
      formData.append("requiredDate", printing.requiredDate || "");
      formData.append("orientation", printing.orientation);
      formData.append("color", printing.color);
      formData.append("stapling", printing.stapling);
      formData.append("paperSize", printing.paperSize);

      if (printDocType === "exam-paper") {
        formData.append("courseName", printing.courseName);
        formData.append("courseCode", printing.courseCode);
        formData.append("examTitle", printing.examTitle);
        formData.append("pagesPerExam", printing.pagesPerExam);
        formData.append("setsCount", printing.setsCount);
        formData.append("totalPages", totalPages);
      } else {
        formData.append("eventName", printing.eventName);
        formData.append("numberOfCertificates", printing.numberOfCertificates);
        formData.append("certificateType", printing.certificateType);
        formData.append("recipientName", printing.recipientName || "");
        if (uploadedRecipientsList) {
          formData.append("recipientsList", uploadedRecipientsList);
        }
      }

      formData.append("document", uploadedFile);

      const result = await dispatch(createPrintingRequest(formData));
      if (result.type === "digitalRequests/createPrinting/fulfilled") {
        toast.success(
          `✓ Request submitted — ID: ${result.payload?.requestId || result.payload?.requestNumber}`,
        );
        setPrintDocType("");
        setUploadedFile(null);
        setUploadedRecipientsList(null);
        setPrinting({
          requiredDate: "",
          orientation: "Single Sided",
          color: "",
          stapling: "",
          paperSize: "",
          courseName: "",
          courseCode: "",
          examTitle: "",
          pagesPerExam: "",
          setsCount: "",
          eventName: "",
          numberOfCertificates: "",
          certificateType: "",
          recipientName: "",
        });
      } else {
        toast.error(result.payload || t.errGeneral);
      }
    } catch {
      toast.error(t.errGeneral);
    }
  };

  /* ── Submit: Risk ── */
  const onSubmitRisk = async (e) => {
    e.preventDefault();
    if (!risk.location || !risk.riskType || !risk.description || !risk.severity) {
      toast.error(t.errRisk);
      return;
    }
    try {
      const result = await dispatch(
        createRiskRequest({
          requesterId: user._id,
          location: risk.location,
          riskType: risk.riskType,
          description: risk.description,
          severity: risk.severity,
          likelihood: risk.likelihood,
          incidentDate: risk.incidentDate || null,
          priority: risk.priority,
          riskAssessment: risk.riskAssessment,
          mitigationActions: risk.mitigationActions,
        }),
      );
      if (result.type === "digitalRequests/createRisk/fulfilled") {
        toast.success(
          `✓ Report submitted — ID: ${result.payload?.requestId || result.payload?.requestNumber}`,
        );
        setRisk({
          location: "",
          riskType: "",
          description: "",
          severity: "",
          likelihood: "",
          priority: "medium",
          incidentDate: "",
          riskAssessment: "",
          mitigationActions: "",
        });
      } else {
        toast.error(result.payload || t.errGeneral);
      }
    } catch {
      toast.error(t.errGeneral);
    }
  };

  /* ── Helpers ── */
  const req = <span className="text-destructive">{t.required}</span>;
  const optBadge = (
    <span className="text-xs text-muted-foreground ml-1">({t.optional})</span>
  );

  const tabs = [
    { id: "software", label: t.softwareTab, icon: <Laptop className="h-4 w-4" /> },
    { id: "printing", label: t.printingTab, icon: <Printer className="h-4 w-4" /> },
    { id: "risk", label: t.riskTab, icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap
              ${
                activeTab === id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════ SOFTWARE INSTALL ══════════════════ */}
      {activeTab === "software" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Laptop className="h-5 w-5 text-muted-foreground" />
            {t.softwareTitle}
          </h3>
          <form onSubmit={onSubmitSoftware} className="space-y-4">
            {/* Software Name */}
            <div className="space-y-1.5">
              <Label>{t.softwareNameLabel} {req}</Label>
              <Textarea
                rows={2}
                placeholder={t.softwareNamePlaceholder}
                value={software.softwareName}
                onChange={(e) =>
                  setSoftware({ ...software, softwareName: e.target.value })
                }
                required
              />
            </div>

            {/* Installation Location */}
            <div className="space-y-1.5">
              <Label>{t.installLocationLabel} {req}</Label>
              <Input
                type="text"
                placeholder={t.installLocationPlaceholder}
                value={software.installationLocation}
                onChange={(e) =>
                  setSoftware({ ...software, installationLocation: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Software Version */}
              <div className="space-y-1.5">
                <Label>{t.softwareVersionLabel} {optBadge}</Label>
                <Input
                  type="text"
                  placeholder={t.softwareVersionPlaceholder}
                  value={software.softwareVersion}
                  onChange={(e) =>
                    setSoftware({ ...software, softwareVersion: e.target.value })
                  }
                />
              </div>
              {/* License Type */}
              <div className="space-y-1.5">
                <Label>{t.licenseTypeLabel} {optBadge}</Label>
                <Select
                  value={software.licenseType}
                  onChange={(e) =>
                    setSoftware({ ...software, licenseType: e.target.value })
                  }>
                  <option value="">{t.licenseSelect}</option>
                  <option value="Perpetual">{t.licenseTypePerpetual}</option>
                  <option value="Annual">{t.licenseTypeAnnual}</option>
                  <option value="Educational">{t.licenseTypeEducational}</option>
                  <option value="Trial">{t.licenseTypeTrial}</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Operating System */}
              <div className="space-y-1.5">
                <Label>{t.operatingSystemLabel} {optBadge}</Label>
                <Select
                  value={software.operatingSystem}
                  onChange={(e) =>
                    setSoftware({ ...software, operatingSystem: e.target.value })
                  }>
                  <option value="">{t.osSelect}</option>
                  <option value="Windows">{t.osWindows}</option>
                  <option value="macOS">{t.osMac}</option>
                  <option value="Linux">{t.osLinux}</option>
                </Select>
              </div>
              {/* Machine Identifier */}
              <div className="space-y-1.5">
                <Label>{t.machineIdLabel} {optBadge}</Label>
                <Input
                  type="text"
                  placeholder={t.machineIdPlaceholder}
                  value={software.machineIdentifier}
                  onChange={(e) =>
                    setSoftware({ ...software, machineIdentifier: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-1.5">
                <Label>{t.priorityLabel}</Label>
                <Select
                  value={software.priority}
                  onChange={(e) =>
                    setSoftware({ ...software, priority: e.target.value })
                  }>
                  <option value="low">{t.priorityLow}</option>
                  <option value="medium">{t.priorityMedium}</option>
                  <option value="high">{t.priorityHigh}</option>
                </Select>
              </div>
              {/* Preferred Date */}
              <div className="space-y-1.5">
                <Label>{t.preferredDateLabel} {optBadge}</Label>
                <Input
                  type="date"
                  value={software.preferredInstallationDate}
                  onChange={(e) =>
                    setSoftware({ ...software, preferredInstallationDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>{t.descriptionLabel} {optBadge}</Label>
              <Textarea
                rows={3}
                placeholder={t.descriptionPlaceholder}
                value={software.description}
                onChange={(e) =>
                  setSoftware({ ...software, description: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</>
              ) : (
                <><Send className="h-4 w-4" /> {t.submitSoftware}</>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* ══════════════════ PRINTING ══════════════════ */}
      {activeTab === "printing" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Printer className="h-5 w-5 text-muted-foreground" />
            {t.printingTitle}
          </h3>

          {/* ── Step 1: choose document type ── */}
          {!printDocType && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t.chooseDocType}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "exam-paper", label: t.examPaper, icon: <FileText className="h-8 w-8" /> },
                  { id: "official-cert", label: t.officialCert, icon: <Trophy className="h-8 w-8" /> },
                ].map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setPrintDocType(doc.id)}
                    className="flex flex-col items-center gap-3 rounded-lg border-2 border-border bg-card p-8 text-center transition-colors hover:border-primary hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="text-muted-foreground">{doc.icon}</span>
                    <p className="font-semibold text-foreground">{doc.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: fill form ── */}
          {printDocType && (
            <form onSubmit={onSubmitPrinting} className="space-y-4">
              {/* Back button */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => {
                    setPrintDocType("");
                    setUploadedFile(null);
                    setFileError("");
                    setUploadedRecipientsList(null);
                    setRecipientsListError("");
                  }}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-foreground">
                  {printDocType === "exam-paper" ? t.examPaper : t.officialCert}
                </span>
              </div>

              {/* ── Exam Paper fields ── */}
              {printDocType === "exam-paper" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>{t.courseNameLabel} {optBadge}</Label>
                      <Input
                        type="text"
                        placeholder={t.courseNamePlaceholder}
                        value={printing.courseName}
                        onChange={(e) =>
                          setPrinting({ ...printing, courseName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.courseCodeLabel} {optBadge}</Label>
                      <Input
                        type="text"
                        placeholder={t.courseCodePlaceholder}
                        value={printing.courseCode}
                        onChange={(e) =>
                          setPrinting({ ...printing, courseCode: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t.examTitleLabel} {optBadge}</Label>
                    <Input
                      type="text"
                      placeholder={t.examTitlePlaceholder}
                      value={printing.examTitle}
                      onChange={(e) =>
                        setPrinting({ ...printing, examTitle: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>{t.pagesPerExamLabel} {req}</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder={t.pagesPlaceholder}
                        value={printing.pagesPerExam}
                        onChange={(e) =>
                          setPrinting({ ...printing, pagesPerExam: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.setsCountLabel} {req}</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder={t.setsPlaceholder}
                        value={printing.setsCount}
                        onChange={(e) =>
                          setPrinting({ ...printing, setsCount: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  {/* Total pages */}
                  <div className="space-y-1.5">
                    <Label>{t.totalPagesLabel}</Label>
                    <Input
                      type="number"
                      value={totalPages}
                      readOnly
                      className="bg-muted/40"
                    />
                  </div>
                </>
              )}

              {/* ── Official Certificate fields ── */}
              {printDocType === "official-cert" && (
                <>
                  <div className="space-y-1.5">
                    <Label>{t.eventNameLabel} {optBadge}</Label>
                    <Input
                      type="text"
                      placeholder={t.eventNamePlaceholder}
                      value={printing.eventName}
                      onChange={(e) =>
                        setPrinting({ ...printing, eventName: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>{t.numCertificatesLabel} {req}</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder={t.numCertPlaceholder}
                        value={printing.numberOfCertificates}
                        onChange={(e) =>
                          setPrinting({ ...printing, numberOfCertificates: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.certTypeLabel} {optBadge}</Label>
                      <Select
                        value={printing.certificateType}
                        onChange={(e) =>
                          setPrinting({ ...printing, certificateType: e.target.value })
                        }>
                        <option value="">{t.certSelect}</option>
                        <option value="Graduation">{t.certGraduation}</option>
                        <option value="Achievement">{t.certAchievement}</option>
                        <option value="Participation">{t.certParticipation}</option>
                        <option value="Other">{t.certOther}</option>
                      </Select>
                    </div>
                  </div>
                  {/* Recipient Name */}
                  <div className="space-y-1.5">
                    <Label>{t.recipientNameLabel} {optBadge}</Label>
                    <Input
                      type="text"
                      placeholder={t.recipientNamePlaceholder}
                      value={printing.recipientName}
                      onChange={(e) =>
                        setPrinting({ ...printing, recipientName: e.target.value })
                      }
                    />
                  </div>
                  {/* Recipients List Upload */}
                  <div className="space-y-1.5">
                    <Label>{t.uploadRecipientsLabel} {optBadge}</Label>
                    <label
                      htmlFor="recipients-list-input"
                      className="flex flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/20 px-4 py-6 text-center cursor-pointer hover:bg-muted/40 transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {t.uploadHint}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.uploadRecipientsSubtitle}
                      </span>
                      <input
                        id="recipients-list-input"
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt,.pdf,.doc,.docx"
                        onChange={handleRecipientsListUpload}
                        className="hidden"
                      />
                    </label>
                    {recipientsListError && (
                      <p className="text-xs text-destructive">{recipientsListError}</p>
                    )}
                    {uploadedRecipientsList && (
                      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{uploadedRecipientsList.name}</span>
                        <button
                          type="button"
                          onClick={() => setUploadedRecipientsList(null)}
                          className="hover:text-green-900">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Shared print settings ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t.orientationLabel}</Label>
                  <Select
                    value={printing.orientation}
                    onChange={(e) =>
                      setPrinting({ ...printing, orientation: e.target.value })
                    }>
                    <option value="Single Sided">{t.singleSided}</option>
                    <option value="Double Sided">{t.doubleSided}</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t.colorLabel} {optBadge}</Label>
                  <Select
                    value={printing.color}
                    onChange={(e) =>
                      setPrinting({ ...printing, color: e.target.value })
                    }>
                    <option value="">{t.colorSelect}</option>
                    <option value="Color">{t.colorFull}</option>
                    <option value="Black & White">{t.colorBW}</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {printDocType !== "official-cert" && (
                  <div className="space-y-1.5">
                    <Label>{t.staplingLabel} {optBadge}</Label>
                    <Select
                      value={printing.stapling}
                      onChange={(e) =>
                        setPrinting({ ...printing, stapling: e.target.value })
                      }>
                      <option value="">{t.staplingSelect}</option>
                      <option value="Yes">{t.staplingYes}</option>
                      <option value="No">{t.staplingNo}</option>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>{t.paperSizeLabel} {optBadge}</Label>
                  <Select
                    value={printing.paperSize}
                    onChange={(e) =>
                      setPrinting({ ...printing, paperSize: e.target.value })
                    }>
                    <option value="">{t.paperSizeSelect}</option>
                    <option value="A4">{t.paperA4}</option>
                    <option value="A3">{t.paperA3}</option>
                    <option value="Letter">{t.paperLetter}</option>
                  </Select>
                </div>
              </div>

              {/* Required by date */}
              <div className="space-y-1.5">
                <Label>{t.requiredDateLabel} {optBadge}</Label>
                <Input
                  type="date"
                  value={printing.requiredDate}
                  onChange={(e) =>
                    setPrinting({ ...printing, requiredDate: e.target.value })
                  }
                />
              </div>

              {/* File upload */}
              <div className="space-y-1.5">
                <Label>
                  {t.uploadDocLabel} {req}
                </Label>
                <label
                  htmlFor="print-file-input"
                  className="flex flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/20 px-4 py-8 text-center cursor-pointer hover:bg-muted/40 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {t.uploadHint}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.uploadDocSubtitle}
                  </span>
                  <input
                    id="print-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {fileError && (
                  <p className="text-xs text-destructive">{fileError}</p>
                )}
                {uploadedFile && (
                  <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{uploadedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="hover:text-green-900">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Important notice */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-amber-800 mb-2">
                    {t.printingNotice}
                  </p>
                  <ul className="space-y-1 text-xs text-amber-700 list-disc list-inside">
                    <li>{t.noticeItem1}</li>
                    <li>{t.noticeItem2}</li>
                    <li>{t.noticeItem3}</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPrintDocType("");
                    setUploadedFile(null);
                    setFileError("");
                    setUploadedRecipientsList(null);
                    setRecipientsListError("");
                  }}>
                  {t.backToTypes}
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</>
                  ) : (
                    <><Send className="h-4 w-4" /> {t.submitPrinting}</>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ══════════════════ RISK REPORT ══════════════════ */}
      {activeTab === "risk" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            {t.riskTitle}
          </h3>
          <form onSubmit={onSubmitRisk} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location */}
              <div className="space-y-1.5">
                <Label>{t.locationLabel} {req}</Label>
                <Input
                  type="text"
                  placeholder={t.locationPlaceholder}
                  value={risk.location}
                  onChange={(e) => setRisk({ ...risk, location: e.target.value })}
                  required
                />
              </div>
              {/* Risk Type */}
              <div className="space-y-1.5">
                <Label>{t.riskTypeLabel} {req}</Label>
                <Select
                  value={risk.riskType}
                  onChange={(e) => setRisk({ ...risk, riskType: e.target.value })}
                  required>
                  <option value="">{t.riskSelect}</option>
                  <option value="Electrical">{t.riskElectrical}</option>
                  <option value="Fire Hazard">{t.riskFire}</option>
                  <option value="Safety Obstruction">{t.riskSafety}</option>
                  <option value="Facility Damage">{t.riskFacility}</option>
                  <option value="Chemical Hazard">{t.riskChemical}</option>
                  <option value="Compliance">{t.riskCompliance}</option>
                  <option value="Other">{t.riskOther}</option>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>{t.descRiskLabel} {req}</Label>
              <Textarea
                rows={4}
                placeholder={t.descRiskPlaceholder}
                value={risk.description}
                onChange={(e) => setRisk({ ...risk, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Severity */}
              <div className="space-y-1.5">
                <Label>{t.severityLabel} {req}</Label>
                <Select
                  value={risk.severity}
                  onChange={(e) => setRisk({ ...risk, severity: e.target.value })}
                  required>
                  <option value="">{t.severitySelect}</option>
                  <option value="Low">{t.severityLow}</option>
                  <option value="Medium">{t.severityMedium}</option>
                  <option value="High">{t.severityHigh}</option>
                  <option value="Critical">{t.severityCritical}</option>
                </Select>
              </div>
              {/* Likelihood */}
              <div className="space-y-1.5">
                <Label>{t.likelihoodLabel} {optBadge}</Label>
                <Select
                  value={risk.likelihood}
                  onChange={(e) => setRisk({ ...risk, likelihood: e.target.value })}>
                  <option value="">{t.likelihoodSelect}</option>
                  <option value="Rare">{t.likelihoodRare}</option>
                  <option value="Unlikely">{t.likelihoodUnlikely}</option>
                  <option value="Possible">{t.likelihoodPossible}</option>
                  <option value="Likely">{t.likelihoodLikely}</option>
                  <option value="Almost Certain">{t.likelihoodAlmost}</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-1.5">
                <Label>{t.riskPriorityLabel}</Label>
                <Select
                  value={risk.priority}
                  onChange={(e) => setRisk({ ...risk, priority: e.target.value })}>
                  <option value="low">{t.priorityLow}</option>
                  <option value="medium">{t.priorityMedium}</option>
                  <option value="high">{t.priorityHigh}</option>
                </Select>
              </div>
              {/* Incident Date */}
              <div className="space-y-1.5">
                <Label>{t.incidentDateLabel} {optBadge}</Label>
                <Input
                  type="date"
                  value={risk.incidentDate}
                  onChange={(e) => setRisk({ ...risk, incidentDate: e.target.value })}
                />
              </div>
            </div>

            {/* Risk Assessment Notes */}
            <div className="space-y-1.5">
              <Label>{t.riskAssessmentLabel} {optBadge}</Label>
              <Textarea
                rows={3}
                placeholder={t.riskAssessmentPlaceholder}
                value={risk.riskAssessment}
                onChange={(e) =>
                  setRisk({ ...risk, riskAssessment: e.target.value })
                }
              />
            </div>

            {/* Mitigation Actions */}
            <div className="space-y-1.5">
              <Label>{t.mitigationLabel} {optBadge}</Label>
              <Textarea
                rows={3}
                placeholder={t.mitigationPlaceholder}
                value={risk.mitigationActions}
                onChange={(e) =>
                  setRisk({ ...risk, mitigationActions: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</>
              ) : (
                <><Send className="h-4 w-4" /> {t.submitRisk}</>
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SingleLevelRequests;
