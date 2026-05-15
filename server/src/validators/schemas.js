import { z } from "zod";

const entityId = z.string().min(16, "Invalid id").max(64, "Invalid id");
const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");
const optionalDate = z
  .union([dateString, z.literal(""), z.null(), z.undefined()])
  .transform((value) => (value ? value : undefined));

export const authSchemas = {
  register: z.object({
    name: z.string().trim().min(2, "Name is required").max(80),
    email: z.string().email("Enter a valid email").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    title: z.string().trim().max(80).optional(),
    department: z.string().trim().max(80).optional()
  }),
  login: z.object({
    email: z.string().email("Enter a valid email").toLowerCase(),
    password: z.string().min(1, "Password is required")
  })
};

export const pairingSchemas = {
  create: z.object({
    mentorEmail: z.string().email("Mentor email is invalid").toLowerCase(),
    menteeEmail: z.string().email("Mentee email is invalid").toLowerCase(),
    startDate: dateString,
    endDate: optionalDate
  }),
  status: z.object({
    status: z.enum(["Active", "Paused", "Ended"]),
    endDate: optionalDate
  }),
  observer: z.object({
    email: z.string().email("Observer email is invalid").toLowerCase()
  })
};

export const sessionSchemas = {
  create: z.object({
    date: dateString,
    agenda: z.string().trim().min(1, "Agenda is required"),
    notes: z.string().trim().min(1, "Notes are required"),
    visibility: z.enum(["pair", "observers"]).default("pair"),
    actionItems: z
      .array(
        z.object({
          description: z.string().trim().min(1, "Action item description is required"),
          owner: entityId,
          dueDate: optionalDate,
          status: z.enum(["Open", "In Progress", "Done"]).default("Open")
        })
      )
      .default([])
  }),
  update: z.object({
    date: dateString.optional(),
    agenda: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional(),
    visibility: z.enum(["pair", "observers"]).optional(),
    actionItems: z
      .array(
        z.object({
          _id: entityId.optional(),
          description: z.string().trim().min(1),
          owner: entityId,
          dueDate: optionalDate,
          status: z.enum(["Open", "In Progress", "Done"]).default("Open")
        })
      )
      .optional()
  })
};

export const feedbackSchemas = {
  create: z.object({
    to: entityId,
    body: z.string().trim().min(1, "Feedback body is required"),
    visibility: z.enum(["pair", "observers"], { required_error: "Visibility is required" })
  })
};

export const kraSchemas = {
  create: z.object({
    title: z.string().trim().min(1, "KRA title is required"),
    description: z.string().trim().optional()
  }),
  kpiCreate: z.object({
    title: z.string().trim().min(1, "KPI title is required"),
    targetValue: z.union([z.string(), z.number()]).transform(String).pipe(z.string().trim().min(1, "Target is required")),
    currentValue: z.union([z.string(), z.number()]).transform(String).pipe(z.string().trim().min(1, "Current value is required")),
    status: z.enum(["On track", "At risk", "Off track"]).default("On track"),
    dueDate: optionalDate
  }),
  kpiUpdate: z.object({
    newValue: z.union([z.string(), z.number()]).transform(String).pipe(z.string().trim().min(1, "New value is required")),
    newStatus: z.enum(["On track", "At risk", "Off track"]),
    note: z.string().trim().optional()
  })
};

export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }));
      return next({ statusCode: 400, message: details[0]?.message || "Validation failed", details });
    }
    req.body = parsed.data;
    next();
  };
}
