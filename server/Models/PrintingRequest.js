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

const printingRequestSchema = new mongoose.Schema(
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
    type: { type: String, default: "" },
    requestedDate: { type: Date },
    requiredDate: { type: Date },
    courseName: { type: String, default: "" },
    courseCode: { type: String, default: "" },
    examTitle: { type: String, default: "" },
    orientation: { type: String, default: "" },
    color: { type: String, default: "" },
    stapling: { type: String, default: "" },
    paperSize: { type: String, default: "" },
    pagesPerExam: { type: Number, default: 0 },
    setsCount: { type: Number, default: 0 },
    totalPages: { type: Number, default: 0 },
    numberOfCertificates: { type: Number, default: 0 },
    certificateType: { type: String, default: "" },
    eventName: { type: String, default: "" },
    recipientName: { type: String, default: "" },
    recipientsListUrl: { type: String, default: "" },
    examFileUrl: { type: String, default: "" },
    certificateFileUrl: { type: String, default: "" },
    additionalFiles: { type: [String], default: [] },
    handlerNotes: { type: String, default: "" },
    printingCompletedAt: { type: Date },
    // Legacy fields
    documentType: { type: String, default: "" },
    numPages: { type: Number, default: 0 },
    numSets: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    approvalFlow: { type: [approvalFlowSchema], default: [] },
    currentStep: { type: Number, default: 1 },
    assignedHandler: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true },
);

export const PrintingRequest = mongoose.model(
  "PrintingRequest",
  printingRequestSchema,
  "printing_requests",
);
