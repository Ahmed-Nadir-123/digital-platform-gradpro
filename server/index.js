import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { User } from "./Models/User.js";
import { Department } from "./Models/Department.js";
import { WorkflowSettings } from "./Models/WorkflowSettings.js";
import { AssignmentRule } from "./Models/assignmentRules.js";
import { Notification } from "./Models/Notification.js";
import { RequestCounter } from "./Models/RequestCounter.js";
import { PurchaseRequest } from "./Models/PurchaseRequest.js";
import { TransportRequest } from "./Models/TransportRequest.js";
import { FoodRequest } from "./Models/FoodRequest.js";
import { FundRequest } from "./Models/FundRequest.js";
import { InstallSoftwareRequest } from "./Models/InstallSoftwareRequest.js";
import { PrintingRequest } from "./Models/PrintingRequest.js";
import { RiskReport } from "./Models/RiskReport.js";
import { MaintenanceRequest } from "./Models/MaintenanceRequest.js";
import { RoleConfig } from "./Models/RoleConfig.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const port = Number(process.env.PORT) || 8080;
const jwtSecret = process.env.JWT_SECRET || "";

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure upload directories exist
for (const dir of ["uploads/profiles", "uploads/printing"]) {
  mkdirSync(path.join(__dirname, dir), { recursive: true });
}

mongoose.set("bufferCommands", false);

const connectString = process.env.MONGODB_URI;

const connectDB = async () => {
  if (!connectString || connectString.includes("your_mongodb_connection_string_here")) {
    throw new Error("MONGODB_URI is not configured. Please set it in the .env file.");
  }
  await mongoose.connect(connectString, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected to MongoDB");
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads/profiles"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile_${Date.now()}${ext}`);
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
    if (!file.mimetype.startsWith("image/") && !allowed.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

const printingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads/printing"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `printing_${Date.now()}${ext}`);
  },
});

const uploadPrinting = multer({
  storage: printingStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const docAllowed = [".pdf", ".doc", ".docx"];
    const listAllowed = [".csv", ".xlsx", ".xls", ".txt", ".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === "recipientsList") {
      if (!listAllowed.includes(ext)) {
        return cb(new Error("Only CSV, Excel, Word, PDF, or TXT files are allowed for recipients list."), false);
      }
    } else if (!docAllowed.includes(ext)) {
      return cb(new Error("Only PDF, DOC, or DOCX files are allowed."), false);
    }
    cb(null, true);
  },
});

const ROLE_ALIASES = {
  "it staff": "it_staff",
  "it hod": "it_hod",
  "it-hod": "it_hod",
  "hoa": "head_academic",
  "hod": "hod",
  "financial": "finance",
  "public relations": "public_relations",
  "avc": "avc",
  "dean": "dean",
};

const normalizeRole = (role) => {
  if (!role) return "";
  const lower = role.trim().toLowerCase();
  return ROLE_ALIASES[lower] || lower;
};

const normalizeRoles = (roles, legacyRole) => {
  const list = Array.isArray(roles) ? roles : typeof roles === "string" ? roles.split(",") : [];
  const normalized = list.map((r) => normalizeRole(r)).filter(Boolean);
  const legacyNormalized = normalizeRole(legacyRole);
  const merged = legacyNormalized ? [...normalized, legacyNormalized] : normalized;
  return Array.from(new Set(merged));
};

const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token." });
    }
    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT secret is not configured." });
    }
    const token = auth.replace("Bearer ", "").trim();
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id).select("-password").populate({ path: "departmentRef", select: "departmentName departmentCode headOfDepartment", populate: { path: "headOfDepartment", select: "fullName staffId" } });
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "User is inactive or not found." });
    }
    req.user = user;
    req.userRoles = normalizeRoles(user.roles);
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed." });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.userRoles?.includes("admin")) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const findDepartmentByCodeOrName = async (value) => {
  if (!value) return null;
  if (isObjectId(value)) {
    return Department.findById(value);
  }
  const code = value.toString().trim().toUpperCase();
  return Department.findOne({
    $or: [
      { departmentCode: code },
      { departmentName: new RegExp(`^${code}$`, "i") },
    ],
  });
};

const parseDeptCodeFromRole = (roleName) => {
  if (!roleName) return "";
  const match = roleName.toLowerCase().match(/^([a-z0-9]+)_hod$/);
  return match ? match[1].toUpperCase() : "";
};

const resolveApproverForRole = async ({
  roleName,
  requester,
  departmentRef,
  departmentName,
  departmentScope,
}) => {
  const normalizedRole = normalizeRole(roleName);
  const scoped = departmentScope ? departmentScope.toUpperCase() : "";
  const deptCode = scoped || parseDeptCodeFromRole(normalizedRole);

  if (deptCode) {
    const dept = await findDepartmentByCodeOrName(deptCode);
    if (dept?.headOfDepartment) {
      return User.findById(dept.headOfDepartment).select("-password");
    }
    return null;
  }

  if (normalizedRole === "hod") {
    if (departmentRef) {
      const dept = await Department.findById(departmentRef);
      if (dept?.headOfDepartment) {
        return User.findById(dept.headOfDepartment).select("-password");
      }
    }
    if (departmentName) {
      const dept = await findDepartmentByCodeOrName(departmentName);
      if (dept?.headOfDepartment) {
        return User.findById(dept.headOfDepartment).select("-password");
      }
    }
    return null;
  }

  return User.findOne({
    $or: [{ roles: normalizedRole }, { role: normalizedRole }],
    isActive: true,
  }).select("-password");
};

const buildApprovalFlow = async (levels, requester, departmentRef, departmentName) => {
  const flow = [];
  for (const level of levels) {
    const approver = await resolveApproverForRole({
      roleName: level.roleName,
      requester,
      departmentRef,
      departmentName,
      departmentScope: level.departmentScope,
    });
    if (!approver && level.isRequired !== false) {
      const roleLabel = level.roleName;
      if (roleLabel === "hod" || roleLabel.endsWith("_hod")) {
        throw new Error(
          "No Head of Department is assigned for your department. Please contact the admin."
        );
      }
      throw new Error(
        `No approver found for required role "${level.roleName}". Please contact the admin.`
      );
    }
    flow.push({
      approverId: approver?._id || undefined,
      role: level.roleName,
      action: "Pending",
      comment: "",
      timestamp: undefined,
      currentApprover: approver?.fullName || "",
    });
  }
  return flow;
};

const generateRequestNumber = async (prefix) => {
  const counter = await RequestCounter.findOneAndUpdate(
    { key: prefix },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  const padded = String(counter.value).padStart(5, "0");
  return `${prefix}${padded}`;
};

const findRequestById = async (Model, id) => {
  if (!id) return null;
  const or = [{ requestNumber: id }, { requestId: id }];
  if (isObjectId(id)) or.push({ _id: id });
  return Model.findOne({ $or: or });
};

const createNotification = async (
  userId,
  requestDoc,
  requestType,
  message,
  messageAr = "",
) => {
  if (!userId) return;
  await Notification.create({
    userId,
    requestId: requestDoc._id,
    requestType,
    requestNumber: requestDoc.requestNumber,
    message,
    messageAr,
  });
};

const resolveRequesterData = async (requesterId, departmentOverride) => {
  const requester = await User.findById(requesterId).select("-password").populate("departmentRef");
  if (!requester) return null;
  const deptRef = requester.departmentRef || (await findDepartmentByCodeOrName(departmentOverride));
  return {
    requester,
    departmentRef: deptRef?._id || undefined,
    departmentName: deptRef?.departmentName || "",
  };
};

const ensureRoles = (roles) => roles.map((r) => normalizeRole(r)).filter(Boolean);

const applyAssignmentRule = async ({ serviceType, requester, departmentRef, Model }) => {
  const rule = await AssignmentRule.findOne({ serviceType, isActive: true });
  if (!rule) return { handler: null, rule: null };

  const targetRole = normalizeRole(rule.targetRole);
  const candidates = await User.find({
    $or: [{ roles: targetRole }, { role: targetRole }],
    isActive: true,
  }).select("-password");
  if (!candidates.length) return { handler: null, rule };

  let selected = null;
  if (rule.assignmentMode === "round_robin") {
    const idx = rule.roundRobinIndex % candidates.length;
    selected = candidates[idx];
    rule.roundRobinIndex = idx + 1;
    await rule.save();
  } else if (rule.assignmentMode === "least_load") {
    let minLoad = Infinity;
    for (const candidate of candidates) {
      const load = await Model.countDocuments({
        assignedTo: candidate._id,
        status: { $in: ["pending", "in_progress"] },
      });
      if (load < minLoad) {
        minLoad = load;
        selected = candidate;
      }
    }
  } else if (rule.assignmentMode === "department") {
    if (departmentRef) {
      selected = candidates.find((c) => c.departmentRef?.toString?.() === departmentRef.toString());
    }
    if (!selected) {
      selected = candidates[0];
    }
  } else if (rule.assignmentMode === "manual") {
    selected = null;
  }

  return { handler: selected, rule };
};

const mapRequesterName = (user) => user?.fullName || "";

const toRoleLabel = (role) => normalizeRole(role);

const SERVICE_PREFIX = {
  purchase: "BUY",
  transportation: "TRN",
  food: "FOOD",
  fund: "FUND",
  install_software: "INS",
  printing: "PRT",
  risk_report: "RSK",
};

const ADMIN_REQUEST_MODELS = {
  purchase: PurchaseRequest,
  PurchaseRequest: PurchaseRequest,
  transportation: TransportRequest,
  TransportRequest: TransportRequest,
  food: FoodRequest,
  FoodRequest: FoodRequest,
  fund: FundRequest,
  FundRequest: FundRequest,
  install_software: InstallSoftwareRequest,
  InstallSoftwareRequest: InstallSoftwareRequest,
  printing: PrintingRequest,
  PrintingRequest: PrintingRequest,
  risk_report: RiskReport,
  RiskReport: RiskReport,
  maintenance: MaintenanceRequest,
  MaintenanceRequest: MaintenanceRequest,
};

const ADMIN_REQUEST_LABELS = {
  purchase: "PurchaseRequest",
  transportation: "TransportRequest",
  food: "FoodRequest",
  fund: "FundRequest",
  install_software: "InstallSoftwareRequest",
  printing: "PrintingRequest",
  risk_report: "RiskReport",
  maintenance: "MaintenanceRequest",
};

const MULTI_LEVEL_TYPES = ["purchase", "transportation", "food", "fund"];

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password").populate({ path: "departmentRef", select: "departmentName departmentCode headOfDepartment", populate: { path: "headOfDepartment", select: "fullName staffId" } });
    if (!user || user.isActive === false) {
      return res.status(400).json({ message: "User not found or inactive." });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Authentication failed." });
    }
    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT secret is not configured." });
    }
    const roles = normalizeRoles(user.roles);
    const token = jwt.sign({ id: user._id, roles }, jwtSecret, { expiresIn: "8h" });
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json({ token, user: userResponse });
  } catch (error) {
    res.status(500).json({ message: "Login failed. " + error.message });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  res.status(200).json({ user: req.user });
});

app.post("/api/upload/profile/:userId", requireAuth, (req, res, next) => {
  uploadProfile.single("photo")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Maximum size is 2 MB." });
      }
      return res.status(400).json({ message: err.message || "File upload error." });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    const { userId } = req.params;
    const isAdmin = req.userRoles?.includes("admin");
    const isSelf = req.user._id.toString() === userId;
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "You can only update your own photo." });
    }
    const photoUrl = `uploads/profiles/${req.file.filename}`;
    const updated = await User.findByIdAndUpdate(
      userId,
      { photoUrl },
      { new: true, select: "-password" },
    ).populate({ path: "departmentRef", select: "departmentName departmentCode headOfDepartment", populate: { path: "headOfDepartment", select: "fullName staffId" } });
    if (!updated) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ message: "Photo uploaded.", photoUrl, user: updated });
  } catch (error) {
    res.status(500).json({ message: "Upload failed: " + error.message });
  }
});

app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      staffId,
      manpowerId,
      fullName,
      initials,
      email,
      password,
      mobileNumber,
      officeContactNumber,
      office,
      department,
      departmentRef,
      specialization,
      academicQualification,
      countryOfIssue,
      yearOfIssue,
      roles,
      isActive,
      nationalId,
    } = req.body;

    if (!staffId || !manpowerId || !fullName || !email || !password) {
      return res.status(400).json({ message: "staffId, manpowerId, fullName, email, password are required." });
    }
    if (!/@utas\.edu\.om$/i.test(email)) {
      return res.status(400).json({ message: "Email must be a @utas.edu.om address." });
    }

    const existing = await User.findOne({
      $or: [{ email }, { staffId }, { manpowerId }],
    });
    if (existing) {
      return res.status(409).json({ message: "User with this email or ID already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRoles = ensureRoles(normalizeRoles(roles, ""));
    const dept = departmentRef || department;

    const user = await User.create({
      staffId,
      manpowerId,
      fullName,
      initials: initials || "",
      email,
      password: hashedPassword,
      mobileNumber: mobileNumber || "",
      officeContactNumber: officeContactNumber || "",
      office: office || "",
      departmentRef: isObjectId(dept) ? dept : (await findDepartmentByCodeOrName(dept))?._id,
      specialization: specialization || "",
      academicQualification: academicQualification || "",
      countryOfIssue: countryOfIssue || "",
      yearOfIssue: yearOfIssue ? Number(yearOfIssue) : undefined,
      roles: normalizedRoles,
      isActive: isActive !== false,
      nationalId: nationalId || "",
    });

    const populated = await User.findById(user._id).select("-password").populate({ path: "departmentRef", select: "departmentName departmentCode headOfDepartment", populate: { path: "headOfDepartment", select: "fullName staffId" } });
    res.status(201).json({ user: populated });
  } catch (error) {
    res.status(500).json({ message: "Error creating user: " + error.message });
  }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const users = await User.find({}).select("-password").populate({ path: "departmentRef", select: "departmentName departmentCode headOfDepartment", populate: { path: "headOfDepartment", select: "fullName staffId" } }).sort({ createdAt: -1 });
  res.status(200).json({ users });
});

app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };

    if (update.email && !/@utas\.edu\.om$/i.test(update.email)) {
      return res.status(400).json({ message: "Email must be a @utas.edu.om address." });
    }
    if (update.roles) {
      update.roles = ensureRoles(normalizeRoles(update.roles));
      delete update.role;
    }

    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
    } else {
      delete update.password;
    }

    if (update.departmentRef || update.department) {
      const dept = update.departmentRef || update.department;
      update.departmentRef = isObjectId(dept) ? dept : (await findDepartmentByCodeOrName(dept))?._id;
    }

    const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true, select: "-password" }).populate({ path: "departmentRef", select: "departmentName departmentCode headOfDepartment", populate: { path: "headOfDepartment", select: "fullName staffId" } });
    if (!updated) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ user: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating user: " + error.message });
  }
});

app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "User not found." });
  res.status(200).json({ message: "User deleted." });
});

app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
  const users = await User.countDocuments({});

  const requestModels = [
    PurchaseRequest,
    TransportRequest,
    FoodRequest,
    FundRequest,
    InstallSoftwareRequest,
    PrintingRequest,
    RiskReport,
  ];
  const requestTypeNames = [
    "PurchaseRequest",
    "TransportRequest",
    "FoodRequest",
    "FundRequest",
    "InstallSoftwareRequest",
    "PrintingRequest",
    "RiskReport",
  ];

  const [counts, pendingCounts, approvedCounts, rejectedCounts, recentByModel, roleBreakdown] =
    await Promise.all([
      Promise.all(requestModels.map((m) => m.countDocuments({}))),
      Promise.all(requestModels.map((m) => m.countDocuments({ status: { $in: ["pending", "Pending", "in_progress", "In Progress"] } }))),
      Promise.all(requestModels.map((m) => m.countDocuments({ status: { $in: ["approved", "Approved", "resolved", "Resolved", "completed", "Completed", "disbursed", "Disbursed"] } }))),
      Promise.all(requestModels.map((m) => m.countDocuments({ status: { $in: ["rejected", "Rejected"] } }))),
      Promise.all(requestModels.map((m) => m.find({}).sort({ createdAt: -1 }).limit(5).populate("requesterId", "fullName").lean())),
      User.aggregate([{ $unwind: { path: "$roles", preserveNullAndEmptyArrays: false } }, { $group: { _id: "$roles", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);

  const recentRequests = recentByModel
    .flatMap((docs, i) => docs.map((doc) => ({ ...doc, requestType: requestTypeNames[i] })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const typeBreakdown = requestTypeNames.map((type, i) => ({
    type,
    total: counts[i],
    pending: pendingCounts[i],
    approved: approvedCounts[i],
    rejected: rejectedCounts[i],
  }));

  res.status(200).json({
    totalUsers: users,
    totalRequests: counts.reduce((sum, v) => sum + v, 0),
    pendingRequests: pendingCounts.reduce((sum, v) => sum + v, 0),
    approvedRequests: approvedCounts.reduce((sum, v) => sum + v, 0),
    rejectedRequests: rejectedCounts.reduce((sum, v) => sum + v, 0),
    recentRequests,
    roleBreakdown,
    typeBreakdown,
  });
});

app.get("/api/admin/requests", requireAuth, requireAdmin, async (req, res) => {
  // Deduplicate: ADMIN_REQUEST_MODELS has both short keys and PascalCase keys pointing
  // to the same Model, so we must query each unique Model only once.
  const seen = new Set();
  const entries = Object.entries(ADMIN_REQUEST_MODELS).filter(([, Model]) => {
    if (seen.has(Model)) return false;
    seen.add(Model);
    return true;
  });
  const requests = await Promise.all(
    entries.map(async ([key, Model]) => {
      const docs = await Model.find({}).sort({ createdAt: -1 }).populate("requesterId", "fullName personal_name").populate("departmentRef", "departmentName").lean();
      return docs.map((doc) => ({
        ...doc,
        requestType: doc.requestType || ADMIN_REQUEST_LABELS[key] || key,
        requestNumber: doc.requestNumber || doc.requestId,
        requesterName: doc.requesterName || doc.name || "",
      }));
    }),
  );
  res.status(200).json({ requests: requests.flat() });
});

app.delete("/api/admin/requests/:requestId/:requestType", requireAuth, requireAdmin, async (req, res) => {
  const Model = ADMIN_REQUEST_MODELS[req.params.requestType] || ADMIN_REQUEST_MODELS[(req.params.requestType || "").toLowerCase()] || null;
  if (!Model) return res.status(400).json({ message: "Invalid request type." });
  const deleted = await Model.findOneAndDelete({
    $or: [{ requestId: req.params.requestId }, { requestNumber: req.params.requestId }, { _id: req.params.requestId }],
  });
  if (!deleted) return res.status(404).json({ message: "Request not found." });
  res.status(200).json({ message: "Request deleted." });
});

app.post("/api/admin/departments", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { departmentCode, departmentName, description, headOfDepartment, isActive } = req.body;
    if (!departmentCode || !departmentName) {
      return res.status(400).json({ message: "departmentCode and departmentName are required." });
    }
    const dept = await Department.create({
      departmentCode: departmentCode.toUpperCase(),
      departmentName,
      description: description || "",
      headOfDepartment: headOfDepartment || undefined,
      isActive: isActive !== false,
    });
    res.status(201).json({ department: dept });
  } catch (error) {
    res.status(500).json({ message: "Error creating department: " + error.message });
  }
});

app.get("/api/admin/departments", requireAuth, requireAdmin, async (req, res) => {
  const departments = await Department.find({}).populate("headOfDepartment", "fullName roles");
  res.status(200).json({ departments });
});

app.put("/api/admin/departments/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.departmentCode) {
      update.departmentCode = update.departmentCode.toUpperCase();
    }
    const updated = await Department.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!updated) return res.status(404).json({ message: "Department not found." });
    res.status(200).json({ department: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating department: " + error.message });
  }
});

app.get("/api/admin/workflow-settings", requireAuth, requireAdmin, async (req, res) => {
  const workflows = await WorkflowSettings.find({}).sort({ requestType: 1 });
  res.status(200).json({ workflows });
});

app.post("/api/admin/workflow-settings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { requestType, workflowName, approvalLevels, isActive } = req.body;
    if (!requestType || !workflowName) {
      return res.status(400).json({ message: "requestType and workflowName are required." });
    }
    const workflow = await WorkflowSettings.create({
      requestType,
      workflowName,
      approvalLevels: approvalLevels || [],
      isActive: isActive !== false,
    });
    res.status(201).json({ workflow });
  } catch (error) {
    res.status(500).json({ message: "Error creating workflow: " + error.message });
  }
});

app.put("/api/admin/workflow-settings/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    const workflow = await WorkflowSettings.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!workflow) return res.status(404).json({ message: "Workflow not found." });
    res.status(200).json({ workflow });
  } catch (error) {
    res.status(500).json({ message: "Error updating workflow: " + error.message });
  }
});

app.get("/api/admin/assignment-rules", requireAuth, requireAdmin, async (req, res) => {
  const rules = await AssignmentRule.find({}).sort({ serviceType: 1 });
  res.status(200).json({ rules });
});

app.post("/api/admin/assignment-rules", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { serviceType, targetRole, assignmentMode, description, isActive } = req.body;
    if (!serviceType || !targetRole || !assignmentMode) {
      return res.status(400).json({ message: "serviceType, targetRole, assignmentMode are required." });
    }
    const rule = await AssignmentRule.create({
      serviceType,
      targetRole: normalizeRole(targetRole),
      assignmentMode,
      description: description || "",
      isActive: isActive !== false,
    });
    res.status(201).json({ rule });
  } catch (error) {
    res.status(500).json({ message: "Error creating assignment rule: " + error.message });
  }
});

app.put("/api/admin/assignment-rules/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.targetRole) update.targetRole = normalizeRole(update.targetRole);
    const rule = await AssignmentRule.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!rule) return res.status(404).json({ message: "Assignment rule not found." });
    res.status(200).json({ rule });
  } catch (error) {
    res.status(500).json({ message: "Error updating assignment rule: " + error.message });
  }
});

app.put("/api/admin/assignment-rules/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.targetRole) update.targetRole = normalizeRole(update.targetRole);
    const rule = await AssignmentRule.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!rule) return res.status(404).json({ message: "Assignment rule not found." });
    res.status(200).json({ rule });
  } catch (error) {
    res.status(500).json({ message: "Error updating assignment rule: " + error.message });
  }
});

// ─── Role Config CRUD ─────────────────────────────────────────────────────
app.get("/api/admin/roles", requireAuth, requireAdmin, async (req, res) => {
  try {
    const roles = await RoleConfig.find().sort({ isSystem: -1, name: 1 });
    res.status(200).json({ roles });
  } catch (error) {
    res.status(500).json({ message: "Error fetching roles: " + error.message });
  }
});

app.post("/api/admin/roles", requireAuth, requireAdmin, async (req, res) => {
  try {
    const name = (req.body.name || "").trim().toLowerCase().replace(/\s+/g, "_");
    const label = (req.body.label || "").trim();
    if (!name) return res.status(400).json({ message: "Role name is required." });
    if (await RoleConfig.findOne({ name })) {
      return res.status(409).json({ message: "Role already exists." });
    }
    const role = await RoleConfig.create({ name, label, isSystem: false });
    res.status(201).json({ role });
  } catch (error) {
    res.status(500).json({ message: "Error creating role: " + error.message });
  }
});

app.delete("/api/admin/roles/:name", requireAuth, requireAdmin, async (req, res) => {
  try {
    const role = await RoleConfig.findOne({ name: req.params.name });
    if (!role) return res.status(404).json({ message: "Role not found." });
    if (role.isSystem) return res.status(403).json({ message: "System roles cannot be deleted." });
    await role.deleteOne();
    res.status(200).json({ message: "Role deleted." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting role: " + error.message });
  }
});

app.get("/api/admin/reports/overview", requireAuth, requireAdmin, async (req, res) => {
  const configs = [
    { type: "purchase", model: PurchaseRequest },
    { type: "transportation", model: TransportRequest },
    { type: "food", model: FoodRequest },
    { type: "fund", model: FundRequest },
    { type: "install_software", model: InstallSoftwareRequest },
    { type: "printing", model: PrintingRequest },
    { type: "risk_report", model: RiskReport },
  ];
  const results = await Promise.all(
    configs.map(async ({ type, model }) => {
      const total = await model.countDocuments();
      const pending = await model.countDocuments({ status: { $in: ["pending", "in_progress"] } });
      const completed = await model.countDocuments({ status: { $in: ["approved", "completed", "resolved", "disbursed"] } });
      const rejected = await model.countDocuments({ status: "rejected" });
      return { type, total, pending, completed, rejected };
    }),
  );
  res.status(200).json({ overview: results });
});

app.get("/api/admin/reports/approval-times", requireAuth, requireAdmin, async (req, res) => {
  const configs = [
    { type: "purchase", model: PurchaseRequest },
    { type: "transportation", model: TransportRequest },
    { type: "food", model: FoodRequest },
    { type: "fund", model: FundRequest },
  ];
  const results = [];
  for (const { type, model } of configs) {
    const docs = await model.find({ status: { $in: ["approved", "disbursed"] } }).lean();
    const durations = docs
      .map((doc) => {
        const last = doc.approvalHistory?.[doc.approvalHistory.length - 1]?.timestamp;
        if (!last || !doc.createdAt) return null;
        return new Date(last).getTime() - new Date(doc.createdAt).getTime();
      })
      .filter((v) => v != null);
    const avgMs = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    results.push({ type, averageMs: avgMs });
  }
  res.status(200).json({ approvalTimes: results });
});

app.get("/api/admin/reports/by-department", requireAuth, requireAdmin, async (req, res) => {
  const configs = [
    { type: "purchase", model: PurchaseRequest },
    { type: "transportation", model: TransportRequest },
    { type: "food", model: FoodRequest },
    { type: "fund", model: FundRequest },
    { type: "install_software", model: InstallSoftwareRequest },
    { type: "printing", model: PrintingRequest },
    { type: "risk_report", model: RiskReport },
  ];
  const results = {};
  for (const { type, model } of configs) {
    const docs = await model.find({}).lean();
    docs.forEach((doc) => {
      const key = doc.department || doc.departmentRef || "Unknown";
      if (!results[key]) results[key] = {};
      results[key][type] = (results[key][type] || 0) + 1;
    });
  }
  res.status(200).json({ byDepartment: results });
});

app.get("/api/admin/reports/handler-load", requireAuth, requireAdmin, async (req, res) => {
  const configs = [
    { type: "install_software", model: InstallSoftwareRequest },
    { type: "printing", model: PrintingRequest },
    { type: "risk_report", model: RiskReport },
  ];
  const loads = {};
  for (const { type, model } of configs) {
    const docs = await model.find({ status: { $in: ["pending", "in_progress"] } }).lean();
    docs.forEach((doc) => {
      const key = doc.assignedTo?.toString?.() || "unassigned";
      if (!loads[key]) loads[key] = { total: 0, services: {} };
      loads[key].total += 1;
      loads[key].services[type] = (loads[key].services[type] || 0) + 1;
    });
  }
  res.status(200).json({ handlerLoad: loads });
});

const createMultiLevelRequest = async ({
  Model,
  requestType,
  prefix,
  requesterId,
  payload,
}) => {
  const resolved = await resolveRequesterData(requesterId, payload.department || payload.departmentRef);
  if (!resolved) {
    return { error: "Requester not found." };
  }
  const { requester, departmentRef, departmentName } = resolved;

  const workflow = await WorkflowSettings.findOne({ requestType, isActive: true });
  if (!workflow || !workflow.approvalLevels?.length) {
    return { error: "Workflow not configured." };
  }

  const approvalLevels = [...workflow.approvalLevels].sort((a, b) => a.level - b.level);
  const firstLevel = approvalLevels[0];
  // Find the first approver that is not the requester themselves
  const firstApprover = await resolveApproverForRole({
    roleName: firstLevel.roleName,
    requester,
    departmentRef,
    departmentName,
    departmentScope: firstLevel.departmentScope,
  });
  const initialLevel = 1;

  const requestNumber = await generateRequestNumber(prefix);
  let approvalFlow;
  try {
    approvalFlow = await buildApprovalFlow(approvalLevels, requester, departmentRef, departmentName);
  } catch (err) {
    return { error: err.message };
  }

  const requestDoc = await Model.create({
    ...payload,
    requestNumber,
    requestId: requestNumber,
    requesterId: requester._id,
    requesterName: mapRequesterName(requester),
    departmentRef: departmentRef,
    department: departmentName,
    status: "pending",
    currentApprovalLevel: initialLevel,
    assignedTo: firstApprover?._id || null,
    approvalHistory: [],
    approvalFlow,
    currentStep: initialLevel,
    assignedHandler: firstApprover?._id || null,
  });

  if (firstApprover) {
    await createNotification(
      firstApprover._id,
      requestDoc,
      requestType,
      `New ${requestType} request assigned: ${requestNumber}`,
      "",
    );
  }

  return { request: requestDoc };
};

const approveMultiLevelRequest = async ({ Model, requestId, approver, action, comments, requestType }) => {
  const request = await findRequestById(Model, requestId);
  if (!request) return { error: "Request not found." };

  if (!request.assignedTo || request.assignedTo.toString() !== approver._id.toString()) {
    return { error: "Not assigned to you." };
  }

  const workflow = await WorkflowSettings.findOne({ requestType, isActive: true });
  if (!workflow) return { error: "Workflow not configured." };

  const levels = [...workflow.approvalLevels].sort((a, b) => a.level - b.level);
  const currentLevel = request.currentApprovalLevel || 1;
  const levelConfig = levels.find((l) => l.level === currentLevel);
  if (!levelConfig) return { error: "Invalid approval level." };

  const allowedRole = normalizeRole(levelConfig.roleName);
  const approverRoles = normalizeRoles(approver.roles);
  const deptCode = parseDeptCodeFromRole(allowedRole);
  if (allowedRole === "hod" || deptCode) {
    const deptTarget = deptCode || request.department;
    let dept = deptTarget ? await findDepartmentByCodeOrName(deptTarget) : null;
    // Fallback: look up via requester's departmentRef if department field is empty
    if (!dept && request.requesterId) {
      const requester = await User.findById(request.requesterId).populate("departmentRef");
      dept = requester?.departmentRef || null;
    }
    if (!dept || dept.headOfDepartment?.toString() !== approver._id.toString()) {
      return { error: "Not authorized for this department." };
    }
  } else if (!approverRoles.includes(allowedRole)) {
    return { error: "Not authorized for this role." };
  }

  request.approvalHistory.push({
    level: currentLevel,
    approverId: approver._id,
    approverName: mapRequesterName(approver),
    approverRole: allowedRole,
    action,
    comments: comments || "",
    timestamp: new Date(),
  });

  if (Array.isArray(request.approvalFlow) && request.approvalFlow[currentLevel - 1]) {
    request.approvalFlow[currentLevel - 1].action = action === "approved" ? "Approved" : "Rejected";
    request.approvalFlow[currentLevel - 1].comment = comments || "";
    request.approvalFlow[currentLevel - 1].timestamp = new Date();
    request.approvalFlow[currentLevel - 1].currentApprover = mapRequesterName(approver);
  }

  if (action === "rejected") {
    request.status = "rejected";
    request.assignedTo = null;
    request.assignedHandler = null;
    await request.save();
    await createNotification(request.requesterId, request, requestType, "Your request was rejected.", "");
    return { request };
  }

  const nextLevel = levels.find((l) => l.level === currentLevel + 1);
  if (!nextLevel) {
    request.status = requestType === "fund" ? "disbursed" : "approved";
    request.assignedTo = null;
    request.assignedHandler = null;
    await request.save();
    await createNotification(request.requesterId, request, requestType, "Your request was approved.", "");
    return { request };
  }

  const nextApprover = await resolveApproverForRole({
    roleName: nextLevel.roleName,
    requester: approver,
    departmentRef: request.departmentRef,
    departmentName: request.department,
    departmentScope: nextLevel.departmentScope,
  });

  request.currentApprovalLevel = nextLevel.level;
  request.assignedTo = nextApprover?._id || null;
  request.assignedHandler = nextApprover?._id || null;
  request.currentStep = nextLevel.level;
  if (Array.isArray(request.approvalFlow) && request.approvalFlow[nextLevel.level - 1]) {
    request.approvalFlow[nextLevel.level - 1].approverId = nextApprover?._id || undefined;
    request.approvalFlow[nextLevel.level - 1].currentApprover = mapRequesterName(nextApprover || {});
  }
  await request.save();

  if (nextApprover) {
    await createNotification(
      nextApprover._id,
      request,
      requestType,
      `New approval required: ${request.requestNumber}`,
      "",
    );
  }

  return { request };
};

const handleSingleLevelStatus = async ({ Model, requestId, handler, newStatus, notes, requestType }) => {
  const request = await findRequestById(Model, requestId);
  if (!request) return { error: "Request not found." };
  if (!request.assignedTo || request.assignedTo.toString() !== handler._id.toString()) {
    return { error: "Not assigned to you." };
  }

  request.approvalHistory.push({
    level: 1,
    approverId: handler._id,
    approverName: mapRequesterName(handler),
    approverRole: normalizeRoles(handler.roles)[0] || "handler",
    action: newStatus,
    comments: notes || "",
    timestamp: new Date(),
  });

  request.status = newStatus;

  const isFinal = ["completed", "resolved", "rejected"].includes(newStatus);
  if (isFinal) {
    request.assignedTo = null;
    request.assignedHandler = null;
  }

  if (requestType === "install_software" && newStatus === "completed") {
    request.installationCompletedAt = new Date();
  }
  if (requestType === "printing" && newStatus === "completed") {
    request.printingCompletedAt = new Date();
  }
  if (requestType === "risk_report" && newStatus === "resolved") {
    request.resolvedBy = handler._id;
    request.resolvedAt = new Date();
  }

  await request.save();
  await createNotification(request.requesterId, request, requestType, "Your request was updated.", "");
  return { request };
};

const requireRole = (roles, required) => {
  const normalized = roles.map((r) => normalizeRole(r));
  return normalized.includes(required);
};

app.post("/api/purchase", requireAuth, async (req, res) => {
  const itemDescription = req.body.itemDescription || req.body.itemName || req.body.items || "";
  const quantity = req.body.quantity;
  const estimatedCost = req.body.estimatedCost || req.body.estimatedBudget || "";
  const justification = req.body.justification || req.body.additionalNotes || "";
  const urgency = req.body.urgency || "medium";
  if (!itemDescription || !quantity || !estimatedCost || !justification) {
    return res.status(400).json({ message: "Missing required fields." });
  }
  const result = await createMultiLevelRequest({
    Model: PurchaseRequest,
    requestType: "purchase",
    prefix: SERVICE_PREFIX.purchase,
    requesterId: req.user._id,
    payload: {
      itemDescription,
      quantity,
      estimatedCost,
      justification,
      urgency,
      priority: urgency?.toLowerCase(),
      requestCategory: req.body.requestCategory || "Purchase",
    },
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(201).json({ request: result.request });
});

app.get("/api/purchase/user/:userId", requireAuth, async (req, res) => {
  const requests = await PurchaseRequest.find({ requesterId: req.params.userId }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/purchase/pending/:approverId", requireAuth, async (req, res) => {
  const requests = await PurchaseRequest.find({ assignedTo: req.params.approverId, status: "pending" }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/purchase/:id", requireAuth, async (req, res) => {
  const request = await findRequestById(PurchaseRequest, req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found." });
  res.status(200).json({ request });
});

app.put("/api/purchase/:id/status", requireAuth, async (req, res) => {
  const { action, comments } = req.body;
  if (!action) return res.status(400).json({ message: "Missing action." });
  const result = await approveMultiLevelRequest({
    Model: PurchaseRequest,
    requestId: req.params.id,
    approver: req.user,
    action: action === "approved" ? "approved" : "rejected",
    comments,
    requestType: "purchase",
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(200).json({ request: result.request });
});

app.post("/api/transportation", requireAuth, async (req, res) => {
  const tripPurpose = req.body.tripPurpose || req.body.purpose || "";
  const destination = req.body.destination || "";
  const departureDate = req.body.departureDate || "";
  const returnDate = req.body.returnDate || null;
  const numberOfPassengers = req.body.numberOfPassengers;
  const vehicleType = req.body.vehicleType || "";
  if (!tripPurpose || !destination || !departureDate || !numberOfPassengers) {
    return res.status(400).json({ message: "Missing required fields." });
  }
  const result = await createMultiLevelRequest({
    Model: TransportRequest,
    requestType: "transportation",
    prefix: SERVICE_PREFIX.transportation,
    requesterId: req.user._id,
    payload: {
      tripPurpose,
      destination,
      departureDate,
      returnDate,
      numberOfPassengers,
      vehicleType,
      additionalNotes: req.body.additionalNotes || "",
    },
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(201).json({ request: result.request });
});

app.get("/api/transportation/user/:userId", requireAuth, async (req, res) => {
  const requests = await TransportRequest.find({ requesterId: req.params.userId }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/transportation/pending/:approverId", requireAuth, async (req, res) => {
  const requests = await TransportRequest.find({ assignedTo: req.params.approverId, status: "pending" }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/transportation/:id", requireAuth, async (req, res) => {
  const request = await findRequestById(TransportRequest, req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found." });
  res.status(200).json({ request });
});

app.put("/api/transportation/:id/status", requireAuth, async (req, res) => {
  const { action, comments } = req.body;
  if (!action) return res.status(400).json({ message: "Missing action." });
  const result = await approveMultiLevelRequest({
    Model: TransportRequest,
    requestId: req.params.id,
    approver: req.user,
    action: action === "approved" ? "approved" : "rejected",
    comments,
    requestType: "transportation",
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(200).json({ request: result.request });
});

app.post("/api/food", requireAuth, async (req, res) => {
  const eventName = req.body.eventName || req.body.occasionName || "";
  const eventDate = req.body.eventDate || "";
  const eventLocation = req.body.eventLocation || req.body.location || "";
  const numberOfAttendees = req.body.numberOfAttendees || req.body.numberOfPersons;
  const mealType = req.body.mealType || "";
  const dietaryRequirements = req.body.dietaryRequirements || "";
  const estimatedBudget = req.body.estimatedBudget || "";
  if (!eventName || !eventDate || !eventLocation || !numberOfAttendees || !mealType) {
    return res.status(400).json({ message: "Missing required fields." });
  }
  const result = await createMultiLevelRequest({
    Model: FoodRequest,
    requestType: "food",
    prefix: SERVICE_PREFIX.food,
    requesterId: req.user._id,
    payload: {
      eventName,
      eventDate,
        eventLocation,
        numberOfAttendees,
      mealType,
      dietaryRequirements,
      estimatedBudget,
        additionalNotes: req.body.additionalNotes || "",
    },
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(201).json({ request: result.request });
});

app.get("/api/food/user/:userId", requireAuth, async (req, res) => {
  const requests = await FoodRequest.find({ requesterId: req.params.userId }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/food/pending/:approverId", requireAuth, async (req, res) => {
  const requests = await FoodRequest.find({ assignedTo: req.params.approverId, status: "pending" }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/food/:id", requireAuth, async (req, res) => {
  const request = await findRequestById(FoodRequest, req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found." });
  res.status(200).json({ request });
});

app.put("/api/food/:id/status", requireAuth, async (req, res) => {
  const { action, comments } = req.body;
  if (!action) return res.status(400).json({ message: "Missing action." });
  const result = await approveMultiLevelRequest({
    Model: FoodRequest,
    requestId: req.params.id,
    approver: req.user,
    action: action === "approved" ? "approved" : "rejected",
    comments,
    requestType: "food",
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(200).json({ request: result.request });
});

app.post("/api/fund", requireAuth, async (req, res) => {
  if (!requireRole(req.userRoles, "hod")) {
    return res.status(403).json({ message: "Only HOD can create fund requests." });
  }
  const fundPurpose = req.body.fundPurpose || req.body.purposeTitle || "";
  const requestedAmount = req.body.requestedAmount || req.body.amountRequested;
  const currency = req.body.currency || "OMR";
  const justification = req.body.justification || "";
  const budgetCode = req.body.budgetCode || "";
  const paymentMethod = req.body.paymentMethod || "";
  const beneficiaryName = req.body.beneficiaryName || "";
  const beneficiaryAccount = req.body.beneficiaryAccount || "";
  if (!fundPurpose || !requestedAmount || !justification) {
    return res.status(400).json({ message: "Missing required fields." });
  }
  const result = await createMultiLevelRequest({
    Model: FundRequest,
    requestType: "fund",
    prefix: SERVICE_PREFIX.fund,
    requesterId: req.user._id,
    payload: {
      fundPurpose,
      requestedAmount,
      currency,
      justification,
      budgetCode,
      paymentMethod,
      beneficiaryName,
      beneficiaryAccount,
        expectedDateNeeded: req.body.expectedDateNeeded || null,
    },
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(201).json({ request: result.request });
});

app.get("/api/fund/user/:userId", requireAuth, async (req, res) => {
  const requests = await FundRequest.find({ requesterId: req.params.userId }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/fund/pending/:approverId", requireAuth, async (req, res) => {
  const requests = await FundRequest.find({ assignedTo: req.params.approverId, status: "pending" }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/fund/:id", requireAuth, async (req, res) => {
  const request = await findRequestById(FundRequest, req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found." });
  res.status(200).json({ request });
});

app.put("/api/fund/:id/status", requireAuth, async (req, res) => {
  const { action, comments } = req.body;
  if (!action) return res.status(400).json({ message: "Missing action." });
  const result = await approveMultiLevelRequest({
    Model: FundRequest,
    requestId: req.params.id,
    approver: req.user,
    action: action === "approved" ? "approved" : "rejected",
    comments,
    requestType: "fund",
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(200).json({ request: result.request });
});

app.post("/api/install-software", requireAuth, async (req, res) => {
  const softwareName = req.body.softwareName || req.body.itemName || req.body.items || "";
  const installationLocation = req.body.installationLocation || req.body.location || req.body.office || "";
  const softwareVersion = req.body.softwareVersion || "";
  const licenseType = req.body.licenseType || "";
  const machineIdentifier = req.body.machineIdentifier || "";
  const operatingSystem = req.body.operatingSystem || "";
  const preferredInstallationDate = req.body.preferredInstallationDate || null;
  const description = req.body.description || req.body.additionalNotes || "";
  const priority = req.body.priority || req.body.urgency || "medium";

  if (!softwareName || !installationLocation) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const resolved = await resolveRequesterData(req.user._id, req.body.department || req.body.departmentRef);
  if (!resolved) return res.status(400).json({ message: "Requester not found." });
  const { requester, departmentRef, departmentName } = resolved;

  const { handler } = await applyAssignmentRule({
    serviceType: "install_software",
    requester,
    departmentRef,
    Model: InstallSoftwareRequest,
  });

  const requestNumber = await generateRequestNumber(SERVICE_PREFIX.install_software);
  const requestDoc = await InstallSoftwareRequest.create({
    requestNumber,
    requestId: requestNumber,
    requesterId: requester._id,
    requesterName: mapRequesterName(requester),
    departmentRef,
    department: departmentName,
    priority: priority || "medium",
    softwareName,
    installationLocation,
    softwareVersion,
    licenseType,
    machineIdentifier,
    operatingSystem,
    preferredInstallationDate,
    description,
    status: "pending",
    assignedTo: handler?._id || null,
  });

  if (handler) {
    await createNotification(
      handler._id,
      requestDoc,
      "install_software",
      `New install software request assigned: ${requestNumber}`,
      "",
    );
  }

  res.status(201).json({ request: requestDoc });
});

app.get("/api/install-software/user/:userId", requireAuth, async (req, res) => {
  const requests = await InstallSoftwareRequest.find({ requesterId: req.params.userId }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/install-software/assigned/:handlerId", requireAuth, async (req, res) => {
  const requests = await InstallSoftwareRequest.find({ assignedTo: req.params.handlerId, status: { $in: ["pending", "in_progress"] } }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/install-software/:id", requireAuth, async (req, res) => {
  const request = await findRequestById(InstallSoftwareRequest, req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found." });
  res.status(200).json({ request });
});

app.put("/api/install-software/:id/status", requireAuth, async (req, res) => {
  const { newStatus, notes } = req.body;
  const allowed = ["pending", "in_progress", "completed", "rejected"];
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({ message: "Invalid status." });
  }
  const result = await handleSingleLevelStatus({
    Model: InstallSoftwareRequest,
    requestId: req.params.id,
    handler: req.user,
    newStatus,
    notes,
    requestType: "install_software",
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(200).json({ request: result.request });
});

app.post("/api/printing", requireAuth, uploadPrinting.fields([{ name: "document", maxCount: 1 }, { name: "recipientsList", maxCount: 1 }]), async (req, res) => {
  const type = req.body.type || req.body.documentType || "";
  const requiredDate = req.body.requiredDate || null;
  const orientation = req.body.orientation || "";
  const color = req.body.color || "";
  const stapling = req.body.stapling || "";
  const paperSize = req.body.paperSize || "";
  const pagesPerExam = req.body.pagesPerExam || req.body.numPages || 0;
  const setsCount = req.body.setsCount || req.body.numSets || 0;
  const numberOfCertificates = req.body.numberOfCertificates || 0;
  const certificateType = req.body.certificateType || "";
  const eventName = req.body.eventName || "";
  const recipientName = req.body.recipientName || "";

  if (!type) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const resolved = await resolveRequesterData(req.user._id, req.body.department || req.body.departmentRef);
  if (!resolved) return res.status(400).json({ message: "Requester not found." });
  const { requester, departmentRef, departmentName } = resolved;

  const { handler } = await applyAssignmentRule({
    serviceType: "printing",
    requester,
    departmentRef,
    Model: PrintingRequest,
  });

  const requestNumber = await generateRequestNumber(SERVICE_PREFIX.printing);
  const requestDoc = await PrintingRequest.create({
    requestNumber,
    requestId: requestNumber,
    requesterId: requester._id,
    requesterName: mapRequesterName(requester),
    departmentRef,
    department: departmentName,
    type,
    requiredDate,
    orientation,
    color,
    stapling,
    paperSize,
    pagesPerExam: Number(pagesPerExam || 0),
    setsCount: Number(setsCount || 0),
    totalPages: Number(pagesPerExam || 0) * Number(setsCount || 0),
    numberOfCertificates: Number(numberOfCertificates || 0),
    certificateType,
    eventName,
    examFileUrl: req.files?.["document"]?.[0] ? `uploads/printing/${req.files["document"][0].filename}` : "",
    certificateFileUrl: req.files?.["document"]?.[0] ? `uploads/printing/${req.files["document"][0].filename}` : "",
    recipientsListUrl: req.files?.["recipientsList"]?.[0] ? `uploads/printing/${req.files["recipientsList"][0].filename}` : "",
    recipientName,
    status: "pending",
    assignedTo: handler?._id || null,
  });

  if (handler) {
    await createNotification(
      handler._id,
      requestDoc,
      "printing",
      `New printing request assigned: ${requestNumber}`,
      "",
    );
  }

  res.status(201).json({ request: requestDoc });
});

app.get("/api/printing/user/:userId", requireAuth, async (req, res) => {
  const requests = await PrintingRequest.find({ requesterId: req.params.userId }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/printing/assigned/:handlerId", requireAuth, async (req, res) => {
  const requests = await PrintingRequest.find({ assignedTo: req.params.handlerId, status: { $in: ["pending", "in_progress"] } }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/printing/:id", requireAuth, async (req, res) => {
  const request = await findRequestById(PrintingRequest, req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found." });
  res.status(200).json({ request });
});

app.put("/api/printing/:id/status", requireAuth, async (req, res) => {
  const { newStatus, notes } = req.body;
  const allowed = ["pending", "in_progress", "completed", "rejected"];
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({ message: "Invalid status." });
  }
  const result = await handleSingleLevelStatus({
    Model: PrintingRequest,
    requestId: req.params.id,
    handler: req.user,
    newStatus,
    notes,
    requestType: "printing",
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(200).json({ request: result.request });
});

app.post("/api/risk-reports", requireAuth, async (req, res) => {
  const location = req.body.location || "";
  const category = req.body.category || req.body.actionRequested || "";
  const riskType = req.body.riskType || "";
  const description = req.body.description || "";
  const severity = req.body.severity || req.body.urgency || "";
  const likelihood = req.body.likelihood || "";
  const incidentDate = req.body.incidentDate || null;
  if (!location || !riskType || !description) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const resolved = await resolveRequesterData(req.user._id, req.body.department || req.body.departmentRef);
  if (!resolved) return res.status(400).json({ message: "Requester not found." });
  const { requester, departmentRef, departmentName } = resolved;

  const { handler } = await applyAssignmentRule({
    serviceType: "risk_report",
    requester,
    departmentRef,
    Model: RiskReport,
  });

  const requestNumber = await generateRequestNumber(SERVICE_PREFIX.risk_report);
  const requestDoc = await RiskReport.create({
    requestNumber,
    requestId: requestNumber,
    requesterId: requester._id,
    requesterName: mapRequesterName(requester),
    departmentRef,
    department: departmentName,
    location,
    category,
    riskType,
    description,
    severity,
    likelihood,
    incidentDate,
    status: "pending",
    assignedTo: handler?._id || null,
  });

  if (handler) {
    await createNotification(
      handler._id,
      requestDoc,
      "risk_report",
      `New risk report assigned: ${requestNumber}`,
      "",
    );
  }

  res.status(201).json({ request: requestDoc });
});

app.get("/api/risk-reports/user/:userId", requireAuth, async (req, res) => {
  const requests = await RiskReport.find({ requesterId: req.params.userId }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/risk-reports/assigned/:handlerId", requireAuth, async (req, res) => {
  const requests = await RiskReport.find({ assignedTo: req.params.handlerId, status: { $in: ["pending", "in_progress"] } }).sort({ createdAt: -1 });
  res.status(200).json({ requests });
});

app.get("/api/risk-reports/:id", requireAuth, async (req, res) => {
  const request = await findRequestById(RiskReport, req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found." });
  res.status(200).json({ request });
});

app.put("/api/risk-reports/:id/status", requireAuth, async (req, res) => {
  const { newStatus, notes } = req.body;
  const allowed = ["pending", "in_progress", "resolved", "rejected"];
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({ message: "Invalid status." });
  }
  const result = await handleSingleLevelStatus({
    Model: RiskReport,
    requestId: req.params.id,
    handler: req.user,
    newStatus,
    notes,
    requestType: "risk_report",
  });
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(200).json({ request: result.request });
});

app.get("/api/notifications/:userId", requireAuth, async (req, res) => {
  const notifications = await Notification.find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const unreadCount = await Notification.countDocuments({ userId: req.params.userId, isRead: false });
  res.status(200).json({ notifications, unreadCount });
});

app.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
  const updated = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!updated) return res.status(404).json({ message: "Notification not found." });
  res.status(200).json({ notification: updated });
});

app.put("/api/notifications/read-all/:userId", requireAuth, async (req, res) => {
  await Notification.updateMany({ userId: req.params.userId, isRead: false }, { isRead: true });
  res.status(200).json({ message: "All notifications marked as read." });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

const DEFAULT_ROLES = [
  { name: "admin", isSystem: true },
  { name: "staff", isSystem: true },
  { name: "hod", isSystem: false },
  { name: "it_hod", isSystem: false },
  { name: "head_academic", isSystem: false },
  { name: "avc", isSystem: false },
  { name: "dean", isSystem: false },
  { name: "finance", isSystem: false },
  { name: "public_relations", isSystem: false },
  { name: "it_staff", isSystem: false },
  { name: "print_officer", isSystem: false },
  { name: "safety_officer", isSystem: false },
];

const seedDefaultRoles = async () => {
  for (const r of DEFAULT_ROLES) {
    await RoleConfig.findOneAndUpdate({ name: r.name }, r, { upsert: true, setDefaultsOnInsert: true });
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultRoles();
    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
      console.log("Static files served from:", path.join(__dirname, "uploads"));
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
