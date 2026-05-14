import * as yup from "yup";

/* ── Purchase Request ─────────────────────────────────────────────────────── */
export const buyingSchemaValidation = yup.object().shape({
  itemDescription: yup
    .string()
    .required("Item description is required")
    .min(5, "Please provide more details about the item")
    .max(500, "Item description is too long"),
  quantity: yup
    .number()
    .typeError("Quantity must be a number")
    .required("Quantity is required")
    .integer("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
  estimatedCost: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .positive("Cost must be a positive number")
    .max(100000, "Cost exceeds maximum limit"),
  justification: yup
    .string()
    .nullable()
    .min(10, "Please provide more detailed justification")
    .max(1000, "Justification is too long"),
  priority: yup
    .string()
    .nullable()
    .oneOf(["low", "medium", "high", ""], "Invalid priority"),
  expectedDeliveryDate: yup.string().nullable(),
});

export const purchaseSchemaValidation = buyingSchemaValidation;

/* ── Software Installation Request ──────────────────────────────────────── */
export const softwareSchemaValidation = yup.object().shape({
  softwareName: yup
    .string()
    .required("Software name is required")
    .min(2, "Software name is too short")
    .max(200, "Software name is too long"),
  installationLocation: yup
    .string()
    .required("Installation location is required")
    .min(2, "Location is too short")
    .max(300, "Location is too long"),
  softwareVersion: yup.string().nullable().max(50, "Version string is too long"),
  licenseType: yup
    .string()
    .nullable()
    .oneOf(["Perpetual", "Annual", "Educational", "Trial", ""], "Invalid license type"),
  operatingSystem: yup
    .string()
    .nullable()
    .oneOf(["Windows", "macOS", "Linux", ""], "Invalid OS"),
  machineIdentifier: yup.string().nullable().max(100, "Machine ID is too long"),
  preferredInstallationDate: yup.string().nullable(),
  priority: yup
    .string()
    .nullable()
    .oneOf(["low", "medium", "high", ""], "Invalid priority"),
  description: yup.string().nullable().max(1000, "Description is too long"),
});

/* ── Transport Request ───────────────────────────────────────────────────── */
export const transportSchemaValidation = yup.object().shape({
  tripPurpose: yup
    .string()
    .required("Trip purpose is required")
    .min(3, "Purpose is too short")
    .max(1000, "Purpose is too long"),
  destination: yup
    .string()
    .required("Destination is required")
    .min(2, "Destination is too short")
    .max(200, "Destination is too long"),
  departureDate: yup.string().required("Departure date is required"),
  returnDate: yup
    .string()
    .nullable()
    .test(
      "return-after-departure",
      "Return date must be after departure date",
      function (value) {
        const { departureDate } = this.parent;
        if (!value || !departureDate) return true;
        return new Date(value) >= new Date(departureDate);
      },
    ),
  numberOfPassengers: yup
    .number()
    .typeError("Number of passengers must be a number")
    .required("Number of passengers is required")
    .integer("Number of passengers must be an integer")
    .min(1, "At least one passenger is required")
    .max(1000, "Number of passengers is too large"),
  vehicleType: yup
    .string()
    .nullable()
    .oneOf(["Car", "Bus", "Van", "Minibus", "Other", ""], "Invalid vehicle type"),
});

/* ── Food Request ────────────────────────────────────────────────────────── */
export const foodSchemaValidation = yup.object().shape({
  eventName: yup
    .string()
    .required("Event name is required")
    .min(3, "Event name is too short")
    .max(200, "Event name is too long"),
  eventDate: yup.string().required("Event date is required"),
  eventLocation: yup
    .string()
    .required("Event location is required")
    .min(2, "Location is too short")
    .max(200, "Location is too long"),
  numberOfAttendees: yup
    .number()
    .typeError("Number of attendees must be a number")
    .required("Number of attendees is required")
    .integer("Number of attendees must be an integer")
    .min(1, "At least one attendee is required")
    .max(10000, "Number of attendees is too large"),
  mealType: yup
    .string()
    .required("Meal type is required")
    .max(100, "Meal type is too long"),
  dietaryRequirements: yup
    .string()
    .nullable()
    .max(500, "Dietary requirements are too long"),
  cateringVendor: yup.string().nullable().max(200, "Vendor name is too long"),
  estimatedBudget: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .positive("Budget must be positive"),
});

/* ── Fund Request ────────────────────────────────────────────────────────── */
export const fundSchemaValidation = yup.object().shape({
  fundPurpose: yup
    .string()
    .required("Fund purpose is required")
    .min(3, "Purpose is too short")
    .max(300, "Purpose is too long"),
  requestedAmount: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? NaN : value))
    .typeError("Amount must be a number")
    .required("Requested amount is required")
    .positive("Amount must be positive")
    .max(100000000, "Amount is too large"),
  currency: yup
    .string()
    .required("Currency is required")
    .max(10, "Currency code is too long"),
  justification: yup
    .string()
    .required("Justification is required")
    .min(10, "Please provide more detailed justification")
    .max(1000, "Justification is too long"),
  budgetCode: yup.string().nullable().max(50, "Budget code is too long"),
  paymentMethod: yup
    .string()
    .nullable()
    .oneOf(["Cash", "Bank Transfer", "Cheque", ""], "Invalid payment method"),
  beneficiaryName: yup.string().nullable().max(200, "Beneficiary name is too long"),
  beneficiaryAccount: yup.string().nullable().max(50, "Account number is too long"),
  disbursementDate: yup.string().nullable(),
});

/* ── Printing Request ────────────────────────────────────────────────────── */
export const printingSchemaValidation = yup.object().shape({
  type: yup
    .string()
    .required("Document type is required")
    .oneOf(["exam-paper", "official-cert"], "Invalid document type"),
  orientation: yup
    .string()
    .required("Orientation is required")
    .oneOf(["Single Sided", "Double Sided"], "Invalid orientation"),
  color: yup
    .string()
    .nullable()
    .oneOf(["Color", "Black & White", ""], "Invalid color option"),
  stapling: yup
    .string()
    .nullable()
    .oneOf(["Yes", "No", ""], "Invalid stapling value"),
  paperSize: yup
    .string()
    .nullable()
    .oneOf(["A4", "A3", "Letter", ""], "Invalid paper size"),
  pagesPerExam: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .integer("Must be a whole number")
    .min(1, "At least 1 page is required"),
  setsCount: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .integer("Must be a whole number")
    .min(1, "At least 1 set is required"),
  numberOfCertificates: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .integer("Must be a whole number")
    .min(1, "At least 1 certificate is required"),
  requiredDate: yup.string().nullable(),
});

/* ── Risk Report ─────────────────────────────────────────────────────────── */
export const riskSchemaValidation = yup.object().shape({
  location: yup
    .string()
    .required("Location is required")
    .min(2, "Location is too short")
    .max(200, "Location is too long"),
  riskType: yup
    .string()
    .required("Risk type is required")
    .min(2, "Risk type is too short")
    .max(200, "Risk type is too long"),
  description: yup
    .string()
    .required("Description is required")
    .min(5, "Description is too short")
    .max(1000, "Description is too long"),
  severity: yup
    .string()
    .required("Severity is required")
    .oneOf(["Low", "Medium", "High", "Critical"], "Invalid severity level"),
  likelihood: yup
    .string()
    .nullable()
    .oneOf(["Rare", "Unlikely", "Possible", "Likely", "Almost Certain", ""], "Invalid likelihood"),
  category: yup.string().nullable().max(200, "Category is too long"),
  incidentDate: yup.string().nullable(),
  riskAssessment: yup.string().nullable().max(1000, "Assessment notes are too long"),
  mitigationActions: yup.string().nullable().max(1000, "Mitigation text is too long"),
});
