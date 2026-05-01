import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { User } from "./Models/User.js";
import { WorkflowSettings } from "./Models/WorkflowSettings.js";
import { Notification } from "./Models/Notification.js";
import { PurchaseRequest } from "./Models/PurchaseRequest.js";
import { TransportRequest } from "./Models/TransportRequest.js";
import { FoodRequest } from "./Models/FoodRequest.js";
import { FundRequest } from "./Models/FundRequest.js";
import { MaintenanceRequest } from "./Models/MaintenanceRequest.js";
import { PrintingRequest } from "./Models/PrintingRequest.js";
import { RiskReport } from "./Models/RiskReport.js";
import { RequestCounter } from "./Models/RequestCounter.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Rate Limiter — login brute-force protection ──────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Multer — profile photo upload ───────────────────────────────────────────
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
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

// ─── Multer — printing document upload ──────────────────────────────────────
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Only PDF, DOC, or DOCX files are allowed."), false);
    }
    cb(null, true);
  },
});

const port = Number(process.env.PORT) || 5000;

mongoose.set("bufferCommands", false);

const connectString = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    if (
      !connectString ||
      connectString.includes("your_mongodb_connection_string_here")
    ) {
      throw new Error(
        "MONGODB_URI is not configured. Please set it in the .env file.",
      );
    }

    await mongoose.connect(connectString, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error connecting to MongoDB:", error.message);
    throw error;
  }
};

// ─── Auth middleware ──────────────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "utas_secret");
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }
    next();
  });
};

// POST /upload/profile  — uploads a profile photo, updates user's photoUrl
app.post(
  "/upload/profile/:userId",
  requireAuth,
  uploadProfile.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }
      const { userId } = req.params;
      const photoUrl = `uploads/profiles/${req.file.filename}`;
      const updated = await User.findByIdAndUpdate(
        userId,
        { photoUrl },
        { new: true, select: "-password" },
      );
      if (!updated) {
        return res.status(404).json({ message: "User not found." });
      }
      res
        .status(200)
        .json({ message: "Photo uploaded.", photoUrl, user: updated });
    } catch (error) {
      res.status(500).json({ message: "Upload failed: " + error.message });
    }
  },
);

app.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Single users collection
    const user = await User.findOne({ email: email }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "User not found.",
      });
    }

    console.log("User Found:", user.personal_name, "Role:", user.role);

    // ✅ Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Authentication failed.",
      });
    }

    console.log("✅ Login successful for:", user.email);

    // ✅ Prepare response
    const userResponse = user.toObject();
    delete userResponse.password;

    if (!userResponse.photoUrl || userResponse.photoUrl.trim() === "") {
      userResponse.photoUrl = "/uploads/default_avatar.png";
    }

    // userType maps role → dashboard routing key used by the client
    // "admin"    → admin dashboard
    // "IT Staff" → handler/IT-staff dashboard
    // "employee" → regular employee dashboard (default)
    let userType;
    if (user.role === "admin") {
      userType = "admin";
    } else if (user.role === "IT Staff") {
      userType = "IT Staff";
    } else {
      userType = "employee";
    }

    res.status(200).json({
      message: "Login successful.",
      user: userResponse,
      userType: userType,
      token: jwt.sign(
        { _id: user._id, role: user.role },
        process.env.JWT_SECRET || "utas_secret",
        { expiresIn: "8h" },
      ),
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred during login." + error.message,
    });
    console.log("Login error:", error);
  }
});

app.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logout successful." });
});

// ─── Auth gate — all routes below this require a valid JWT ────────────────────
app.use((req, res, next) => {
  requireAuth(req, res, next);
});

// ─── Maintenance / HelpDesk ───────────────────────────────────────────────────
app.post("/maintenanceRequests", async (req, res) => {
  try {
    const {
      requesterId,
      name,
      contactNo,
      location,
      type,
      severity,
      dateTime,
      description,
      remarks,
      risk,
    } = req.body;
    if (!name || !contactNo || !location || !type || !description) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const requestId = `MNT${Date.now()}`;
    const request = new MaintenanceRequest({
      requestId,
      requesterId: requesterId || null,
      name,
      contactNo,
      location,
      type,
      severity: severity || "Low",
      dateTime: dateTime || "",
      description,
      remarks: remarks || "",
      risk: risk || "No",
    });
    await request.save();
    await applyWorkflow("MaintenanceRequest", request);
    res.status(201).json({
      message: "Maintenance request submitted successfully.",
      requestId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error submitting request: " + error.message });
  }
});

app.post("/maintenanceRequests/:requestId/approve", (req, res) =>
  processGenericApproval(MaintenanceRequest, req, res),
);

app.get("/maintenanceRequests", async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find().sort({ createdAt: -1 });
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /users/:userId — fetch a single user's current data (for client-side refresh)
app.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

async function generateRequestId() {
  const counter = await RequestCounter.findOneAndUpdate(
    { key: "BUY" },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  const newId = String(counter.value).padStart(8, "0");
  return `BUY${newId}`;
}

app.post("/purchaseRequests", async (req, res) => {
  try {
    const {
      requesterId,
      itemName,
      quantity,
      urgency,
      estimatedBudget,
      justification,
      additionalNotes,
      requestCategory,
    } = req.body;

    if (!requesterId || !itemName || !quantity || !urgency) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ message: "Requester not found." });
    }

    const requestId = await generateRequestId();

    const purchaseRequest = new PurchaseRequest({
      requestId: requestId,
      requesterId,
      itemName,
      quantity,
      urgency,
      estimatedBudget: estimatedBudget || "",
      justification: justification || "",
      additionalNotes: additionalNotes || "",
      requestCategory: requestCategory === "Software" ? "Software" : "Purchase",
      expectedDeliveryDate: null,
      status: "Pending",
    });

    await purchaseRequest.save();
    await applyWorkflow("PurchaseRequest", purchaseRequest);

    console.log(
      "✅ Purchase request created:",
      purchaseRequest.requestId,
      "by",
      requester.personal_name,
    );

    res.status(201).json({
      message: "Purchase request created successfully.",
      requestId: requestId,
      currentApprover:
        purchaseRequest.approvalFlow?.[0]?.currentApprover || null,
      status: purchaseRequest.status,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "An error occurred while creating the purchase request." +
        error.message,
    });
    console.log("Error creating purchase request:", error);
  }
});

app.post("/purchaseRequests/:requestId/approve", (req, res) =>
  processGenericApproval(PurchaseRequest, req, res),
);

app.get("/purchaseRequests/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await PurchaseRequest.findOne({ requestId })
      .populate("requesterId", "personal_name email department office")
      .populate("approvalFlow.approverId", "personal_name role email");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    res.status(200).json({
      request,
    });
    console.log("Fetched request:", request);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching request: " + error.message,
    });
    console.log("Error fetching request:", error);
  }
});

// ── Printing Requests ──────────────────────────────────────────────────
app.post(
  "/printingRequests",
  uploadPrinting.single("document"),
  async (req, res) => {
    try {
      const {
        requesterId,
        documentType,
        orientation,
        stapling,
        numPages,
        numSets,
        notes,
      } = req.body;
      if (
        !requesterId ||
        !documentType ||
        !orientation ||
        !stapling ||
        !numPages ||
        !numSets
      ) {
        return res.status(400).json({ message: "Missing required fields." });
      }
      const requester = await User.findById(requesterId);
      if (!requester)
        return res.status(404).json({ message: "Requester not found." });

      const fileUrl = req.file ? `uploads/printing/${req.file.filename}` : "";
      const requestId = `PRN${Date.now()}`;
      const request = new PrintingRequest({
        requestId,
        requesterId,
        documentType,
        orientation,
        stapling,
        numPages: Number(numPages),
        numSets: Number(numSets),
        notes: notes || "",
        fileUrl,
      });
      await request.save();
      await applyWorkflow("PrintingRequest", request);
      res.status(201).json({
        message: "Printing request submitted successfully.",
        requestId,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating printing request: " + error.message });
    }
  },
);

app.post("/printingRequests/:requestId/approve", (req, res) =>
  processGenericApproval(PrintingRequest, req, res),
);

// ── Transport Requests ──────────────────────────────────────────────────
app.post("/transportRequests", async (req, res) => {
  try {
    const {
      requesterId,
      destination,
      departureDate,
      returnDate,
      numberOfPassengers,
      purpose,
      urgency,
      additionalNotes,
    } = req.body;

    if (
      !requesterId ||
      !destination ||
      !departureDate ||
      !numberOfPassengers ||
      !purpose
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ message: "Requester not found." });
    }

    const requestId = `TRN${Date.now()}`;

    const transportRequest = new TransportRequest({
      requestId,
      requesterId,
      destination,
      departureDate: new Date(departureDate),
      returnDate: returnDate ? new Date(returnDate) : null,
      numberOfPassengers,
      purpose,
      urgency: urgency || "Medium",
      additionalNotes: additionalNotes || "",
    });
    await transportRequest.save();
    await applyWorkflow("TransportRequest", transportRequest);

    console.log(
      "✅ Transport request created:",
      requestId,
      "by",
      requester.personal_name,
    );
    res.status(201).json({
      message: "Transport request submitted successfully.",
      requestId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating transport request: " + error.message });
  }
});

app.post("/transportRequests/:requestId/approve", (req, res) =>
  processGenericApproval(TransportRequest, req, res),
);

// ── Food Requests ───────────────────────────────────────────────────────
app.post("/foodRequests", async (req, res) => {
  try {
    const {
      requesterId,
      occasionName,
      eventDate,
      numberOfPersons,
      mealType,
      location,
      dietaryRequirements,
      urgency,
      additionalNotes,
    } = req.body;

    if (
      !requesterId ||
      !occasionName ||
      !eventDate ||
      !numberOfPersons ||
      !mealType ||
      !location
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ message: "Requester not found." });
    }

    const requestId = `FOOD${Date.now()}`;

    const foodRequest = new FoodRequest({
      requestId,
      requesterId,
      occasionName,
      eventDate: new Date(eventDate),
      numberOfPersons,
      mealType,
      location,
      dietaryRequirements: dietaryRequirements || "",
      urgency: urgency || "Medium",
      additionalNotes: additionalNotes || "",
    });
    await foodRequest.save();
    await applyWorkflow("FoodRequest", foodRequest);

    console.log(
      "✅ Food request created:",
      requestId,
      "by",
      requester.personal_name,
    );
    res
      .status(201)
      .json({ message: "Food request submitted successfully.", requestId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating food request: " + error.message });
  }
});

app.post("/foodRequests/:requestId/approve", (req, res) =>
  processGenericApproval(FoodRequest, req, res),
);

// ── Fund Requests ───────────────────────────────────────────────────────
app.post("/fundRequests", async (req, res) => {
  try {
    const {
      requesterId,
      purposeTitle,
      amountRequested,
      currency,
      urgency,
      justification,
      expectedDateNeeded,
      additionalNotes,
    } = req.body;

    if (!requesterId || !purposeTitle || !amountRequested || !justification) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ message: "Requester not found." });
    }

    const requestId = `FUND${Date.now()}`;

    const fundRequest = new FundRequest({
      requestId,
      requesterId,
      purposeTitle,
      amountRequested,
      currency: currency || "OMR",
      urgency: urgency || "Medium",
      justification,
      expectedDateNeeded: expectedDateNeeded
        ? new Date(expectedDateNeeded)
        : null,
      additionalNotes: additionalNotes || "",
    });
    await fundRequest.save();
    await applyWorkflow("FundRequest", fundRequest);

    console.log(
      "✅ Fund request created:",
      requestId,
      "by",
      requester.personal_name,
    );
    res
      .status(201)
      .json({ message: "Fund request submitted successfully.", requestId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating fund request: " + error.message });
  }
});

app.post("/fundRequests/:requestId/approve", (req, res) =>
  processGenericApproval(FundRequest, req, res),
);

// ── All requests submitted by a user (all 4 types) ─────────────────────────
app.get("/requests/my/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const populate = (q) =>
      q
        .populate("requesterId", "personal_name email department")
        .populate("approvalFlow.approverId", "personal_name role")
        .populate("assignedHandler", "personal_name role")
        .lean();

    const [purchase, transport, food, fund, maintenance, printing, risk] =
      await Promise.all([
        populate(PurchaseRequest.find({ requesterId: userId })).then((r) =>
          r.map((x) => ({ ...x, requestType: "PurchaseRequest" })),
        ),
        populate(TransportRequest.find({ requesterId: userId })).then((r) =>
          r.map((x) => ({ ...x, requestType: "TransportRequest" })),
        ),
        populate(FoodRequest.find({ requesterId: userId })).then((r) =>
          r.map((x) => ({ ...x, requestType: "FoodRequest" })),
        ),
        populate(FundRequest.find({ requesterId: userId })).then((r) =>
          r.map((x) => ({ ...x, requestType: "FundRequest" })),
        ),
        MaintenanceRequest.find({ requesterId: userId })
          .lean()
          .then((r) =>
            r.map((x) => ({ ...x, requestType: "MaintenanceRequest" })),
          ),
        PrintingRequest.find({ requesterId: userId })
          .lean()
          .then((r) =>
            r.map((x) => ({ ...x, requestType: "PrintingRequest" })),
          ),
        RiskReport.find({ requesterId: userId })
          .lean()
          .then((r) => r.map((x) => ({ ...x, requestType: "RiskReport" }))),
      ]);

    const requests = [
      ...purchase,
      ...transport,
      ...food,
      ...fund,
      ...maintenance,
      ...printing,
      ...risk,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ requests });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching requests: " + error.message });
  }
});

// ── Unified pending requests endpoint (all types, all workflow modes) ────────
app.get("/requests/pending/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Fetch workflow configs so we know chain vs group per type
    const configs = await WorkflowSettings.find({
      type: { $in: VALID_REQUEST_TYPES },
    });
    const modeOf = (type) => {
      const cfg = configs.find((c) => c.type === type);
      return cfg ? cfg.workflowType : "chain";
    };

    const populate = { requesterId: "personal_name email department" };

    // Helper: fetch pending for a chain-type collection
    const chainPending = async (Model, requestType) => {
      const all = await Model.find({ status: "Pending" })
        .populate("requesterId", populate.requesterId)
        .sort({ createdAt: -1 });
      return all
        .filter((r) => {
          const step = r.approvalFlow?.[(r.currentStep || 1) - 1];
          return (
            step &&
            step.approverId?.toString() === userId &&
            step.action === "Pending"
          );
        })
        .map((r) => ({ ...r.toObject(), requestType, workflowMode: "chain" }));
    };

    // Helper: fetch pending for a group-type collection
    const groupPending = async (Model, requestType) => {
      const all = await Model.find({
        status: "Pending",
        assignedHandler: userId,
      })
        .populate("requesterId", populate.requesterId)
        .sort({ createdAt: -1 });
      return all.map((r) => ({
        ...r.toObject(),
        requestType,
        workflowMode: "group",
      }));
    };

    const typeMap = [
      { type: "PurchaseRequest", Model: PurchaseRequest },
      { type: "TransportRequest", Model: TransportRequest },
      { type: "FoodRequest", Model: FoodRequest },
      { type: "FundRequest", Model: FundRequest },
      { type: "MaintenanceRequest", Model: MaintenanceRequest },
      { type: "PrintingRequest", Model: PrintingRequest },
      { type: "RiskReport", Model: RiskReport },
    ];

    const results = await Promise.all(
      typeMap.map(({ type, Model }) =>
        modeOf(type) === "group"
          ? groupPending(Model, type)
          : chainPending(Model, type),
      ),
    );

    const merged = results
      .flat()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(merged);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching pending requests: " + error.message });
  }
});

// ── Risk Reports ────────────────────────────────────────────────────────
app.post("/riskReports", async (req, res) => {
  try {
    const {
      requesterId,
      location,
      riskType,
      urgency,
      description,
      actionRequested,
    } = req.body;
    if (!requesterId || !location || !riskType || !description) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const requester = await User.findById(requesterId);
    if (!requester)
      return res.status(404).json({ message: "Requester not found." });

    const requestId = `RISK${Date.now()}`;
    const report = new RiskReport({
      requestId,
      requesterId,
      location,
      riskType,
      urgency: urgency || "Medium",
      description,
      actionRequested: actionRequested || "",
    });
    await report.save();
    await applyWorkflow("RiskReport", report);
    res
      .status(201)
      .json({ message: "Risk report submitted successfully.", requestId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating risk report: " + error.message });
  }
});

app.post("/riskReports/:requestId/approve", (req, res) =>
  processGenericApproval(RiskReport, req, res),
);

// ── Shared workflow helper ──────────────────────────────────────────────────
const VALID_REQUEST_TYPES = [
  "PurchaseRequest",
  "TransportRequest",
  "FoodRequest",
  "FundRequest",
  "MaintenanceRequest",
  "PrintingRequest",
  "RiskReport",
];

/**
 * Reads WorkflowSettings for the given requestType and applies routing to
 * the (already-saved) request document.
 * - chain: builds approvalFlow[], sets currentStep = 1, saves
 * - group: picks next handler by round-robin, sets assignedHandler, saves
 */
async function applyWorkflow(requestType, request) {
  const workflow = await WorkflowSettings.findOne({ type: requestType })
    .populate("steps.approverId")
    .populate("handlerGroup.handlerId");

  if (!workflow) return; // no config → no routing

  if (workflow.workflowType === "chain" && workflow.steps.length > 0) {
    workflow.steps.sort((a, b) => a.sequence_value - b.sequence_value);
    request.approvalFlow = workflow.steps.map((step) => ({
      approverId: step.approverId._id,
      role: step.role,
      action: "Pending",
      comment: "",
      currentApprover: step.approverId.personal_name,
    }));
    request.currentStep = 1;
    await request.save();
  } else if (
    workflow.workflowType === "group" &&
    workflow.handlerGroup.length > 0
  ) {
    const idx = workflow.roundRobinIndex % workflow.handlerGroup.length;
    request.assignedHandler = workflow.handlerGroup[idx].handlerId._id;
    workflow.roundRobinIndex = idx + 1;
    await Promise.all([request.save(), workflow.save()]);
  }
}

// ── Notification helper ──────────────────────────────────────────────────────
const REQUEST_TYPE_LABELS = {
  PurchaseRequest: "Purchase Request",
  TransportRequest: "Transport Request",
  FoodRequest: "Food & Catering Request",
  FundRequest: "Fund Request",
  MaintenanceRequest: "Maintenance Request",
  PrintingRequest: "Printing Request",
  RiskReport: "Risk Report",
};

async function createNotification(userId, typeName, requestId, action) {
  try {
    const label = REQUEST_TYPE_LABELS[typeName] || typeName;
    const actionEn = action === "Approved" ? "approved" : "rejected";
    const actionAr = action === "Approved" ? "الموافقة عليه" : "رفضه";
    await Notification.create({
      userId,
      message: `Your ${label} (#${requestId}) has been ${actionEn}.`,
      messageAr: `طلبك (${requestId}) تم ${actionAr}.`,
      requestId,
      requestType: typeName,
    });
  } catch {
    // Non-critical — don't fail the main request
  }
}

/**
 * Generic approve/reject handler shared by Purchase, Transport, Food, Fund.
 * Supports both chain and group workflows.
 */
async function processGenericApproval(Model, req, res) {
  try {
    const { requestId } = req.params;
    const { approverId, action, comment, expectedDeliveryDate } = req.body;

    if (!["Approved", "Rejected"].includes(action)) {
      return res
        .status(400)
        .json({ message: "action must be 'Approved' or 'Rejected'." });
    }

    const request = await Model.findOne({ requestId });
    if (!request)
      return res.status(404).json({ message: "Request not found." });
    if (request.status !== "Pending") {
      return res.status(400).json({
        message: "Request already " + request.status.toLowerCase() + ".",
      });
    }

    const approver = await User.findById(approverId);
    if (!approver)
      return res.status(404).json({ message: "Approver not found." });

    const typeName = Model.modelName;

    // ── Group mode: assignedHandler must match ────────────────────────────
    if (request.assignedHandler) {
      if (request.assignedHandler.toString() !== approverId) {
        return res.status(403).json({
          message: "You are not the assigned handler for this request.",
        });
      }
      request.status = action;
      await request.save();
      await createNotification(
        request.requesterId,
        typeName,
        requestId,
        action,
      );
      return res.status(200).json({
        message: "Request " + action.toLowerCase() + ".",
        status: action,
      });
    }

    // ── Chain mode: current step approver must match ───────────────────────
    if (!request.approvalFlow || request.approvalFlow.length === 0) {
      // No workflow configured — simple direct approval
      request.status = action;
      await request.save();
      await createNotification(
        request.requesterId,
        typeName,
        requestId,
        action,
      );
      return res.status(200).json({
        message: "Request " + action.toLowerCase() + ".",
        status: action,
      });
    }

    const stepIndex = (request.currentStep || 1) - 1;
    const currentApproval = request.approvalFlow[stepIndex];

    if (!currentApproval) {
      return res.status(400).json({ message: "Invalid current step." });
    }
    if (currentApproval.approverId.toString() !== approverId) {
      return res.status(403).json({
        message: `Not authorized at this step. Waiting for ${currentApproval.currentApprover}.`,
      });
    }

    currentApproval.action = action;
    currentApproval.comment = comment || "";
    currentApproval.timestamp = new Date();
    currentApproval.currentApprover = approver.personal_name;

    if (action === "Rejected") {
      request.status = "Rejected";
      await request.save();
      await createNotification(
        request.requesterId,
        typeName,
        requestId,
        "Rejected",
      );
      return res
        .status(200)
        .json({ message: "Request rejected.", status: "Rejected" });
    }

    // Approved
    if (request.currentStep >= request.approvalFlow.length) {
      if (expectedDeliveryDate)
        request.expectedDeliveryDate = new Date(expectedDeliveryDate);
      request.status = "Approved";
      await request.save();
      await createNotification(
        request.requesterId,
        typeName,
        requestId,
        "Approved",
      );
      return res
        .status(200)
        .json({ message: "Request fully approved.", status: "Approved" });
    }

    request.currentStep += 1;
    await request.save();
    const next = request.approvalFlow[request.currentStep - 1];
    return res.status(200).json({
      message: "Approved. Moved to next approver.",
      currentStep: request.currentStep,
      nextApproval: next.currentApprover,
    });
  } catch (error) {
    res.status(500).json({ message: "Approval error: " + error.message });
  }
}

// ── Notification Endpoints ──────────────────────────────────────────────────
app.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unread = await Notification.countDocuments({ userId, isRead: false });
    res.status(200).json({ notifications, unreadCount: unread });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching notifications: " + error.message });
  }
});

app.patch("/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true },
    );
    if (!updated)
      return res.status(404).json({ message: "Notification not found." });
    res.status(200).json({ notification: updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error marking notification read: " + error.message });
  }
});

app.patch("/notifications/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error marking all read: " + error.message });
  }
});

// ── Admin Workflows ──────────────────────────────────────────────────────────
app.get("/admin/workflows", requireAdmin, async (req, res) => {
  try {
    const configs = await WorkflowSettings.find({
      type: { $in: VALID_REQUEST_TYPES },
    })
      .populate("steps.approverId", "personal_name role")
      .populate("handlerGroup.handlerId", "personal_name role");

    const result = VALID_REQUEST_TYPES.map((type) => {
      const found = configs.find((c) => c.type === type);
      return found
        ? found.toObject()
        : {
            type,
            workflowType: "chain",
            steps: [],
            handlerGroup: [],
            roundRobinIndex: 0,
          };
    });

    res.status(200).json({ workflows: result });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching workflows: " + error.message });
  }
});

// PUT /admin/workflows/:requestType — upsert workflow configuration
app.put("/admin/workflows/:requestType", requireAdmin, async (req, res) => {
  try {
    const { requestType } = req.params;
    if (!VALID_REQUEST_TYPES.includes(requestType)) {
      return res.status(400).json({ message: "Invalid request type." });
    }

    const { workflowType, steps, handlerGroup } = req.body;
    if (!["chain", "group"].includes(workflowType)) {
      return res
        .status(400)
        .json({ message: "workflowType must be 'chain' or 'group'." });
    }

    const update = {
      workflowType,
      steps: workflowType === "chain" ? steps || [] : [],
      handlerGroup: workflowType === "group" ? handlerGroup || [] : [],
      roundRobinIndex: 0,
    };

    const config = await WorkflowSettings.findOneAndUpdate(
      { type: requestType },
      { $set: update },
      { new: true, upsert: true },
    )
      .populate("steps.approverId", "personal_name role")
      .populate("handlerGroup.handlerId", "personal_name role");

    res.status(200).json({ message: "Workflow saved.", workflow: config });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error saving workflow: " + error.message });
  }
});

// GET /admin/stats  — summary counts
app.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const STATS_MODELS = [
      { model: PurchaseRequest, type: "PurchaseRequest" },
      { model: TransportRequest, type: "TransportRequest" },
      { model: FoodRequest, type: "FoodRequest" },
      { model: FundRequest, type: "FundRequest" },
      { model: MaintenanceRequest, type: "MaintenanceRequest" },
      { model: PrintingRequest, type: "PrintingRequest" },
      { model: RiskReport, type: "RiskReport" },
    ];

    const [
      totalUsers,
      totalCounts,
      pendingCounts,
      approvedCounts,
      rejectedCounts,
      roleBreakdown,
      recentRequests,
    ] = await Promise.all([
      User.countDocuments(),
      Promise.all(STATS_MODELS.map(({ model }) => model.countDocuments())),
      Promise.all(
        STATS_MODELS.map(({ model }) =>
          model.countDocuments({ status: "Pending" }),
        ),
      ),
      Promise.all(
        STATS_MODELS.map(({ model }) =>
          model.countDocuments({ status: "Approved" }),
        ),
      ),
      Promise.all(
        STATS_MODELS.map(({ model }) =>
          model.countDocuments({ status: "Rejected" }),
        ),
      ),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Promise.all(
        STATS_MODELS.map(({ model, type }) =>
          model
            .find({})
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("requesterId", "personal_name")
            .lean()
            .then((r) => r.map((x) => ({ ...x, requestType: type }))),
        ),
      ),
    ]);

    const sum = (arr) => arr.reduce((a, b) => a + b, 0);

    const typeBreakdown = STATS_MODELS.map(({ type }, i) => ({
      type,
      total: totalCounts[i],
      pending: pendingCounts[i],
      approved: approvedCounts[i],
      rejected: rejectedCounts[i],
    }));

    const recent = recentRequests
      .flat()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.status(200).json({
      totalUsers,
      totalRequests: sum(totalCounts),
      pendingRequests: sum(pendingCounts),
      approvedRequests: sum(approvedCounts),
      rejectedRequests: sum(rejectedCounts),
      roleBreakdown,
      typeBreakdown,
      recentRequests: recent,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats: " + error.message });
  }
});

// GET /admin/users  — all users (exclude password)
app.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users: " + error.message });
  }
});

// PATCH /admin/users/:userId  — update role or isActive (inline quick-edit)
app.patch("/admin/users/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, isActive } = req.body;

    const allowedRoles = ["admin", "IT Staff", "employee"];
    if (role !== undefined && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const update = {};
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, select: "-password" },
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User updated.", user: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating user: " + error.message });
  }
});

// POST /admin/users  — create a new user
app.post("/admin/users", requireAdmin, async (req, res) => {
  try {
    const {
      staffId,
      personal_name,
      initials,
      national_id,
      manpower_id,
      gender,
      nationality,
      email,
      password,
      mobile_number,
      department,
      office,
      office_contact_number,
      academic_qualification,
      year_of_issue,
      specialization,
      name_of_university,
      country_of_issue,
      role,
      isActive,
    } = req.body;

    if (!staffId || !personal_name || !email || !password) {
      return res.status(400).json({
        message: "staffId, personal_name, email and password are required.",
      });
    }

    const allowedRoles = ["admin", "IT Staff", "employee"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const existing = await User.findOne({
      $or: [{ email }, { staffId }],
    });
    if (existing) {
      return res.status(409).json({
        message: "A user with this email or staff ID already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      staffId,
      personal_name,
      initials: initials || "",
      national_id: national_id || "",
      manpower_id: manpower_id || "",
      gender: gender || undefined,
      nationality: nationality || "",
      email,
      password: hashedPassword,
      mobile_number: mobile_number || "",
      department: department || "",
      office: office || "",
      office_contact_number: office_contact_number || "",
      academic_qualification: academic_qualification || "",
      year_of_issue: year_of_issue ? Number(year_of_issue) : undefined,
      specialization: specialization || "",
      name_of_university: name_of_university || "",
      country_of_issue: country_of_issue || "",
      role: role || "employee",
      isActive: isActive !== undefined ? isActive : true,
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res
      .status(201)
      .json({ message: "User created successfully.", user: userResponse });
  } catch (error) {
    res.status(500).json({ message: "Error creating user: " + error.message });
  }
});

// PUT /admin/users/:userId  — full edit of a user
app.put("/admin/users/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      staffId,
      personal_name,
      initials,
      national_id,
      manpower_id,
      gender,
      nationality,
      email,
      password,
      mobile_number,
      department,
      office,
      office_contact_number,
      academic_qualification,
      year_of_issue,
      specialization,
      name_of_university,
      country_of_issue,
      role,
      isActive,
    } = req.body;

    if (!staffId || !personal_name || !email) {
      return res
        .status(400)
        .json({ message: "staffId, personal_name and email are required." });
    }

    const allowedRoles = ["admin", "IT Staff", "employee"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    // Check uniqueness against OTHER users
    const duplicate = await User.findOne({
      $or: [{ email }, { staffId }],
      _id: { $ne: userId },
    });
    if (duplicate) {
      return res.status(409).json({
        message: "Another user with this email or staff ID already exists.",
      });
    }

    const update = {
      staffId,
      personal_name,
      initials: initials || "",
      national_id: national_id || "",
      manpower_id: manpower_id || "",
      nationality: nationality || "",
      email,
      mobile_number: mobile_number || "",
      department: department || "",
      office: office || "",
      office_contact_number: office_contact_number || "",
      academic_qualification: academic_qualification || "",
      specialization: specialization || "",
      name_of_university: name_of_university || "",
      country_of_issue: country_of_issue || "",
      role: role || "employee",
      isActive: isActive !== undefined ? isActive : true,
    };

    if (gender) update.gender = gender;
    if (year_of_issue) update.year_of_issue = Number(year_of_issue);

    // Only update password if a new one is provided
    if (password && password.trim() !== "") {
      update.password = await bcrypt.hash(password, 10);
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, select: "-password" },
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found." });
    }

    res
      .status(200)
      .json({ message: "User updated successfully.", user: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating user: " + error.message });
  }
});

// DELETE /admin/users/:userId  — remove a user permanently
app.delete("/admin/users/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user: " + error.message });
  }
});

// DELETE /admin/requests/:requestId/:requestType  — remove a request
app.delete(
  "/admin/requests/:requestId/:requestType",
  requireAdmin,
  async (req, res) => {
    try {
      const { requestId, requestType } = req.params;
      const modelMap = {
        PurchaseRequest,
        TransportRequest,
        FoodRequest,
        FundRequest,
        MaintenanceRequest,
        PrintingRequest,
        RiskReport,
      };
      const Model = modelMap[requestType];
      if (!Model) {
        return res.status(400).json({ message: "Invalid request type." });
      }
      const deleted = await Model.findByIdAndDelete(requestId);
      if (!deleted) {
        return res.status(404).json({ message: "Request not found." });
      }
      res.status(200).json({ message: "Request deleted successfully." });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting request: " + error.message });
    }
  },
);

// GET /admin/requests  — all requests across all types
app.get("/admin/requests", requireAdmin, async (req, res) => {
  try {
    const populateQuery = (query) =>
      query
        .populate("requesterId", "personal_name email department")
        .populate("approvalFlow.approverId", "personal_name role")
        .lean();

    const [purchase, transport, food, fund, maintenance, printing, risk] =
      await Promise.all([
        populateQuery(PurchaseRequest.find({})).then((r) =>
          r.map((x) => ({ ...x, requestType: "PurchaseRequest" })),
        ),
        populateQuery(TransportRequest.find({})).then((r) =>
          r.map((x) => ({ ...x, requestType: "TransportRequest" })),
        ),
        populateQuery(FoodRequest.find({})).then((r) =>
          r.map((x) => ({ ...x, requestType: "FoodRequest" })),
        ),
        populateQuery(FundRequest.find({})).then((r) =>
          r.map((x) => ({ ...x, requestType: "FundRequest" })),
        ),
        MaintenanceRequest.find({})
          .lean()
          .then((r) =>
            r.map((x) => ({ ...x, requestType: "MaintenanceRequest" })),
          ),
        PrintingRequest.find({})
          .lean()
          .then((r) =>
            r.map((x) => ({ ...x, requestType: "PrintingRequest" })),
          ),
        RiskReport.find({})
          .lean()
          .then((r) => r.map((x) => ({ ...x, requestType: "RiskReport" }))),
      ]);

    const requests = [
      ...purchase,
      ...transport,
      ...food,
      ...fund,
      ...maintenance,
      ...printing,
      ...risk,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ requests });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching requests: " + error.message });
  }
});

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed WorkflowSettings if not exists
    const existingWorkflow = await WorkflowSettings.findOne({
      type: "PurchaseRequest",
    });
    if (!existingWorkflow) {
      const manager = await User.findOne({ role: { $ne: "itstaff" } });
      if (manager) {
        await WorkflowSettings.create({
          type: "PurchaseRequest",
          steps: [
            {
              sequence_value: 1,
              role: manager.role || "IT Manager",
              approverId: manager._id,
            },
          ],
        });
        console.log(
          "✅ WorkflowSettings auto-seeded with manager:",
          manager.personal_name,
        );
      } else {
        console.warn(
          "⚠️ No manager found — WorkflowSettings not seeded. Run seedUsers.js to create test users.",
        );
      }
    }

    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
      console.log("Static files served from:", path.join(__dirname, "uploads"));
    });
  } catch (error) {
    console.error("❌ Server startup failed due to database connection error.");
    process.exit(1);
  }
};

startServer();
