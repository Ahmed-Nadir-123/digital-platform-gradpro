/**
 * fetchWorkflows.js
 * Run: node fetchWorkflows.js
 *
 * Connects to MongoDB, prints all WorkflowSettings as formatted JSON.
 * Use this as a read-only backup / reference if you need to restore configs.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

import { WorkflowSettings } from "./Models/WorkflowSettings.js";

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("ERROR: MONGODB_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✔  Connected to MongoDB\n");

  const workflows = await WorkflowSettings.find({})
    .sort({ requestType: 1 })
    .lean();

  if (!workflows.length) {
    console.log("No workflows found in database.");
  } else {
    console.log(`Found ${workflows.length} workflow(s):\n`);
    console.log("=".repeat(60));
    for (const wf of workflows) {
      console.log(`\n► ${wf.requestType}  (${wf.workflowName})`);
      console.log(`  type    : ${wf.workflowType || "chain"}`);
      console.log(`  active  : ${wf.isActive}`);
      if (wf.workflowType === "group") {
        console.log(`  handlers: ${wf.handlerGroup?.length || 0}`);
        (wf.handlerGroup || []).forEach((h, i) =>
          console.log(`    [${i + 1}] ${h.handlerName} (${h.handlerRole})`)
        );
      } else {
        console.log(`  levels  : ${wf.approvalLevels?.length || 0}`);
        (wf.approvalLevels || [])
          .sort((a, b) => a.level - b.level)
          .forEach((l) =>
            console.log(`    [${l.level}] roleName="${l.roleName}"  required=${l.isRequired}`)
          );
      }
    }
    console.log("\n" + "=".repeat(60));
    console.log("\nFull JSON backup:\n");
    console.log(JSON.stringify(workflows, null, 2));
  }

  await mongoose.disconnect();
  console.log("\n✔  Done.");
};

run().catch((err) => {
  console.error("Error:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
