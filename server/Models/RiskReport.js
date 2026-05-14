import mongoose from "mongoose";

const approvalHistorySchema = new mongoose.Schema(
  {
    level: { type: Number },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    approverName: { type: String },
    approverRole: { type: String },
    action: { type: String },
    comments: { type: String, default: "" },
    timestamp: { type: Date },
  },
  { _id: false },
);

const approvalFlowSchema = new mongoose.Schema(
  {
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    role: { type: String, default: "" },
    action: { type: String, default: "Pending" },
    comment: { type: String, default: "" },
    timestamp: { type: Date },
    currentApprover: { type: String, default: "" },
  },
  { _id: false },
);

const riskReportSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true },
    requestId: { type: String, unique: true, sparse: true },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    requesterName: { type: String, required: true },
    departmentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    department: { type: String, default: "" },
    status: { type: String, default: "pending" },
    currentApprovalLevel: { type: Number, default: 1 },
    approvalHistory: { type: [approvalHistorySchema], default: [] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    attachments: { type: [String], default: [] },
    location: { type: String, default: "" },
    riskType: { type: String, default: "" },
    description: { type: String, default: "" },
    severity: { type: String, default: "" },
    likelihood: { type: String, default: "" },
    reportedAt: { type: Date },
    incidentDate: { type: Date },
    evidenceFileUrl: { type: String, default: "" },
    riskAssessment: { type: String, default: "" },
    mitigationActions: { type: String, default: "" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String, default: "" },
    // Legacy fields
    urgency: { type: String, default: "Medium" },
    actionRequested: { type: String, default: "" },
    approvalFlow: { type: [approvalFlowSchema], default: [] },
    currentStep: { type: Number, default: 1 },
    assignedHandler: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true },
);

export const RiskReport = mongoose.model(
  "RiskReport",
  riskReportSchema,
  "risk_reports",
);
