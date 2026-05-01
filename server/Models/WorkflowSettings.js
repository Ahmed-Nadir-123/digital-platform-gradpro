import mongoose from "mongoose";

const workflowSettingsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
    },
    workflowType: {
      type: String,
      enum: ["chain", "group"],
      default: "chain",
    },
    steps: [
      {
        sequence_value: {
          type: Number,
          required: true,
        },
        role: {
          type: String,
          required: true,
        },
        approverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    handlerGroup: [
      {
        handlerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        handlerName: {
          type: String,
          required: true,
        },
        handlerRole: {
          type: String,
          default: "",
        },
      },
    ],
    roundRobinIndex: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const WorkflowSettings = mongoose.model(
  "WorkflowSettings",
  workflowSettingsSchema,
  "workflowSettings",
);
