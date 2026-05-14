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

const fundRequestSchema = new mongoose.Schema(
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
    fundPurpose: { type: String, default: "" },
    requestedAmount: { type: Number, default: 0 },
    currency: { type: String, default: "OMR" },
    justification: { type: String, default: "" },
    budgetCode: { type: String, default: "" },
    paymentMethod: { type: String, default: "" },
    beneficiaryName: { type: String, default: "" },
    beneficiaryAccount: { type: String, default: "" },
    disbursementDate: { type: Date },
    // Legacy fields
    purposeTitle: { type: String, default: "" },
    amountRequested: { type: Number, default: 0 },
    urgency: { type: String, default: "Medium" },
    expectedDateNeeded: { type: Date },
    additionalNotes: { type: String, default: "" },
    approvalFlow: { type: [approvalFlowSchema], default: [] },
    currentStep: { type: Number, default: 1 },
    assignedHandler: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true },
);

export const FundRequest = mongoose.model(
  "FundRequest",
  fundRequestSchema,
  "fundrequests",
);
