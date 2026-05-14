import mongoose from "mongoose";

const roleConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    label: { type: String, default: "" },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const RoleConfig = mongoose.model("roles_config", roleConfigSchema);
