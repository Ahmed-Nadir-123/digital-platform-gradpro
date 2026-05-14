import mongoose from "mongoose";

const assignmentRuleSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      required: true,
    },
    assignmentMode: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    roundRobinIndex: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const AssignmentRule = mongoose.model(
  "AssignmentRule",
  assignmentRuleSchema,
  "assignment_rules",
);
