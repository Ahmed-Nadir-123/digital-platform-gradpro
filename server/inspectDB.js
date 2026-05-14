/**
 * inspectDB.js — Database inspection utility
 * Lists every collection, its fields (from sampled documents),
 * document count, and a few sample records.
 *
 * Usage:  node inspectDB.js
 * (runs from server/ directory; reads server/.env)
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const SAMPLE_LIMIT = 2; // how many sample docs to print per collection

const SKIP_FIELDS = new Set(["__v"]);

function flattenFields(obj, prefix = "") {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SKIP_FIELDS.has(key)) continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof mongoose.Types.ObjectId) && !(val instanceof Date)) {
      Object.assign(fields, flattenFields(val, fullKey));
    } else {
      const type = Array.isArray(val)
        ? `Array(${val.length})`
        : val === null
        ? "null"
        : val instanceof mongoose.Types.ObjectId
        ? "ObjectId"
        : val instanceof Date
        ? "Date"
        : typeof val;
      fields[fullKey] = type;
    }
  }
  return fields;
}

async function inspectCollection(db, collectionName) {
  const collection = db.collection(collectionName);
  const count = await collection.countDocuments();
  const samples = await collection.find({}).limit(SAMPLE_LIMIT).toArray();

  // Collect all unique field paths from all sample docs
  const allFields = {};
  for (const doc of samples) {
    const flat = flattenFields(doc);
    for (const [k, v] of Object.entries(flat)) {
      if (!allFields[k]) allFields[k] = v;
    }
  }

  return { collectionName, count, fields: allFields, samples };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in server/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name).sort();

  console.log("=".repeat(70));
  console.log(`DATABASE: ${db.databaseName}`);
  console.log(`Collections found: ${names.length}`);
  console.log("=".repeat(70));

  for (const name of names) {
    const { count, fields, samples } = await inspectCollection(db, name);

    console.log(`\n${"─".repeat(70)}`);
    console.log(`COLLECTION: ${name}   (${count} document${count !== 1 ? "s" : ""})`);
    console.log("─".repeat(70));

    if (Object.keys(fields).length === 0) {
      console.log("  (empty — no documents to sample)");
    } else {
      console.log("  FIELDS:");
      for (const [field, type] of Object.entries(fields)) {
        console.log(`    ${field.padEnd(40)} ${type}`);
      }
    }

    if (samples.length > 0) {
      console.log(`\n  SAMPLE DOCUMENTS (up to ${SAMPLE_LIMIT}):`);
      for (let i = 0; i < samples.length; i++) {
        const doc = { ...samples[i] };
        delete doc.password; // never print passwords
        console.log(`\n  [${i + 1}] ${JSON.stringify(doc, null, 4).replace(/\n/g, "\n  ")}`);
      }
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("Inspection complete.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
