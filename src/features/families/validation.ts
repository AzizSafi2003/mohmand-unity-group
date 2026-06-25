import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : undefined));

/** Validation for the family form. Mirrors `families.create` args. */
export const familySchema = z.object({
  name: z.string().trim().min(1, "validation.required"),
  namePs: optionalText,
  description: optionalText,
  descriptionPs: optionalText,
  isActive: z.boolean().optional(),
});

export type FamilyFormValues = z.infer<typeof familySchema>;
