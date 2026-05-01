import * as yup from "yup";

export const buyingSchemaValidation = yup.object().shape({
  items: yup
    .string()
    .required("Items are required")
    .min(5, "Please provide more details about the items")
    .max(500, "Items description is too long"),

  quantity: yup
    .string()
    .required("Quantity is required")
    .matches(/^[0-9]+$/, "Quantity must be a number"),

  urgency: yup
    .string()
    .required("Urgency level is required")
    .oneOf(["Low", "Medium", "High"], "Invalid urgency level"),

  estimatedBudget: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .positive("Budget must be a positive number")
    .min(1, "Budget must be at least 1 OMR")
    .max(100000, "Budget exceeds maximum limit"),

  justification: yup
    .string()
    .nullable()
    .min(10, "Please provide more detailed justification")
    .max(1000, "Justification is too long"),

  additionalNotes: yup
    .string()
    .nullable()
    .max(500, "Additional notes are too long"),
});

export const transportSchemaValidation = yup.object().shape({
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
  purpose: yup
    .string()
    .required("Purpose is required")
    .min(3, "Purpose is too short")
    .max(1000, "Purpose is too long"),
  urgency: yup
    .string()
    .required("Urgency level is required")
    .oneOf(["Low", "Medium", "High"], "Invalid urgency level"),
  additionalNotes: yup
    .string()
    .nullable()
    .max(500, "Additional notes are too long"),
});

export const foodSchemaValidation = yup.object().shape({
  occasionName: yup
    .string()
    .required("Occasion name is required")
    .min(3, "Occasion name is too short")
    .max(200, "Occasion name is too long"),
  eventDate: yup.string().required("Event date is required"),
  numberOfPersons: yup
    .number()
    .typeError("Number of persons must be a number")
    .required("Number of persons is required")
    .integer("Number of persons must be an integer")
    .min(1, "At least one person is required")
    .max(10000, "Number of persons is too large"),
  mealType: yup
    .string()
    .required("Meal type is required")
    .max(100, "Meal type is too long"),
  location: yup
    .string()
    .required("Location is required")
    .min(2, "Location is too short")
    .max(200, "Location is too long"),
  dietaryRequirements: yup
    .string()
    .nullable()
    .max(500, "Dietary requirements are too long"),
  urgency: yup
    .string()
    .required("Urgency level is required")
    .oneOf(["Low", "Medium", "High"], "Invalid urgency level"),
  additionalNotes: yup
    .string()
    .nullable()
    .max(500, "Additional notes are too long"),
});

export const fundSchemaValidation = yup.object().shape({
  purposeTitle: yup
    .string()
    .required("Purpose title is required")
    .min(3, "Purpose title is too short")
    .max(300, "Purpose title is too long"),
  amountRequested: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? NaN : value))
    .typeError("Amount requested must be a number")
    .required("Amount requested is required")
    .positive("Amount requested must be positive")
    .max(100000000, "Amount requested is too large"),
  currency: yup
    .string()
    .required("Currency is required")
    .max(10, "Currency code is too long"),
  urgency: yup
    .string()
    .required("Urgency level is required")
    .oneOf(["Low", "Medium", "High"], "Invalid urgency level"),
  justification: yup
    .string()
    .required("Justification is required")
    .min(10, "Please provide more detailed justification")
    .max(1000, "Justification is too long"),
  expectedDateNeeded: yup.string().nullable(),
  additionalNotes: yup
    .string()
    .nullable()
    .max(500, "Additional notes are too long"),
});
