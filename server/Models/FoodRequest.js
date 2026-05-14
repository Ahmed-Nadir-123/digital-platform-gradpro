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

const foodRequestSchema = new mongoose.Schema(
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
    eventName: { type: String, default: "" },
    eventDate: { type: Date },
    eventLocation: { type: String, default: "" },
    numberOfAttendees: { type: Number, default: 0 },
    mealType: { type: String, default: "" },
    dietaryRequirements: { type: String, default: "" },
    estimatedBudget: { type: Number, default: 0 },
    cateringVendor: { type: String, default: "" },
    // Legacy fields
    occasionName: { type: String, default: "" },
    numberOfPersons: { type: Number, default: 0 },
    location: { type: String, default: "" },
    urgency: { type: String, default: "Medium" },
    additionalNotes: { type: String, default: "" },
    approvalFlow: { type: [approvalFlowSchema], default: [] },
    currentStep: { type: Number, default: 1 },
    assignedHandler: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true },
);

export const FoodRequest = mongoose.model(
  "FoodRequest",
  foodRequestSchema,
  "foodrequests",
);
