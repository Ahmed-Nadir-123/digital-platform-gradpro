import mongoose from "mongoose";

const approvalLevelSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true },
    roleName: { type: String, required: true },
    isRequired: { type: Boolean, default: true },
    timeoutDays: { type: Number, default: 0 },
    minAmount: { type: Number },
    maxAmount: { type: Number },
    departmentScope: { type: String, default: "" },
  },
  { _id: false },
);

const workflowSettingsSchema = new mongoose.Schema(
  {
    requestType: { type: String, required: true, unique: true },
    workflowName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    approvalLevels: { type: [approvalLevelSchema], default: [] },
  },
  { timestamps: true },
);

export const WorkflowSettings = mongoose.model(
  "WorkflowSettings",
  workflowSettingsSchema,
  "workflowsettings",
);
