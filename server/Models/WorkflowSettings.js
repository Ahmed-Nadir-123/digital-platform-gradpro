import mongoose from "mongoose";

const approvalLevelSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true },
    roleName: { type: String, required: true },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
    isRequired: { type: Boolean, default: true },
    timeoutDays: { type: Number, default: 0 },
    minAmount: { type: Number },
    maxAmount: { type: Number },
    departmentScope: { type: String, default: "" },
  },
  { _id: false },
);

const handlerGroupSchema = new mongoose.Schema(
  {
    handlerId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    handlerName: { type: String, default: "" },
    handlerRole: { type: String, default: "" },
  },
  { _id: false },
);

const workflowSettingsSchema = new mongoose.Schema(
  {
    requestType: { type: String, required: true, unique: true },
    workflowName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    workflowType: { type: String, enum: ["chain", "group"], default: "chain" },
    approvalLevels: { type: [approvalLevelSchema], default: [] },
    handlerGroup: { type: [handlerGroupSchema], default: [] },
  },
  { timestamps: true },
);

export const WorkflowSettings = mongoose.model(
  "WorkflowSettings",
  workflowSettingsSchema,
  "workflowsettings",
);
