import { z } from "zod";

/**
 * Client-side guard for the record-payment form. The Convex mutation enforces
 * the same `amount > 0` rule server-side (defence in depth) — this exists to
 * give immediate, translated feedback before a round-trip.
 */
export const recordPaymentSchema = z.object({
  amount: z
    .number({ invalid_type_error: "validation.positiveNumber" })
    .positive("validation.positiveNumber"),
  method: z.string().trim().max(60).optional(),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
