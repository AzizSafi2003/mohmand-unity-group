import { z } from "zod";
import { GENDERS, MARITAL_STATUSES } from "@/lib/constants";

/** Optional string that treats "" as undefined (so empty inputs aren't sent). */
const optionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || z.string().email().safeParse(v).success, {
    message: "validation.invalidEmail",
  });

/**
 * Validation for the member form. Mirrors the Convex `members.create` args.
 * `firstName` / `lastName` / `gender` / `maritalStatus` are required; the rest
 * are optional. Error messages are i18n keys resolved at render time.
 */
export const memberSchema = z.object({
  firstName: z.string().trim().min(1, "validation.required"),
  lastName: z.string().trim().min(1, "validation.required"),
  firstNamePs: optionalText,
  lastNamePs: optionalText,
  gender: z.enum(GENDERS),
  maritalStatus: z.enum(MARITAL_STATUSES),
  dateOfBirth: optionalText,
  dateOfDeath: optionalText,
  phone: optionalText,
  email: optionalEmail,
  address: optionalText,
  occupation: optionalText,
  notes: optionalText,
  isHead: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type MemberFormValues = z.infer<typeof memberSchema>;
