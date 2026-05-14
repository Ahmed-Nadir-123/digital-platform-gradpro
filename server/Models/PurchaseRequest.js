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

const purchaseRequestSchema = new mongoose.Schema(
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
    itemDescription: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    justification: { type: String, default: "" },
    urgency: { type: String, default: "medium" },
    expectedDeliveryDate: { type: Date },
    // Legacy fields
    requestCategory: { type: String, default: "Purchase" },
    itemName: { type: String, default: "" },
    estimatedBudget: { type: String, default: "" },
    additionalNotes: { type: String, default: "" },
    approvalFlow: { type: [approvalFlowSchema], default: [] },
    currentStep: { type: Number, default: 1 },
    assignedHandler: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true },
);

export const PurchaseRequest = mongoose.model(
  "PurchaseRequest",
  purchaseRequestSchema,
  "purchaserequests",
);
