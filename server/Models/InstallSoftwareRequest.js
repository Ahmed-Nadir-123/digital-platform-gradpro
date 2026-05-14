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

const installSoftwareRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true },
    requestId: { type: String, unique: true, sparse: true },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    requesterName: { type: String, default: "" },
    departmentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    department: { type: String, default: "" },
    softwareName: { type: String, required: true },
    softwareVersion: { type: String, default: "" },
    licenseType: { type: String, default: "" },
    installationLocation: { type: String, required: true },
    machineIdentifier: { type: String, default: "" },
    operatingSystem: { type: String, default: "" },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    requestedDate: { type: Date },
    preferredInstallationDate: { type: Date },
    description: { type: String, default: "" },
    attachments: { type: [String], default: [] },
    status: { type: String, default: "pending" },
    currentApprovalLevel: { type: Number, default: 1 },
    approvalHistory: { type: [approvalHistorySchema], default: [] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    handlerNotes: { type: String, default: "" },
    installationCompletedAt: { type: Date },
  },
  { timestamps: true },
);

export const InstallSoftwareRequest = mongoose.model(
  "InstallSoftwareRequest",
  installSoftwareRequestSchema,
  "installsoftware_requests",
);
