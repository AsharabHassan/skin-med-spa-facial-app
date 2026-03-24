import { z } from "zod";

export const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^[+\d\s\-()]+$/, "Enter a valid phone number"),
  marketingConsent: z.boolean().refine((v) => v === true, {
    message: "You must agree to continue",
  }),
});

export type LeadFormData = z.infer<typeof leadSchema>;
