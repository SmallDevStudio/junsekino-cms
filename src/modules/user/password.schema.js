import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(128, "Password must not exceed 128 characters.")
  .refine(
    (value) => /[a-z]/.test(value),
    "Password must contain a lowercase letter.",
  )
  .refine(
    (value) => /[A-Z]/.test(value),
    "Password must contain an uppercase letter.",
  )
  .refine((value) => /\d/.test(value), "Password must contain a number.");

export const resetUserPasswordSchema = z
  .object({
    password: passwordSchema,

    confirmPassword: z.string().min(1),

    companyId: z.string().trim().min(1).max(200).optional(),

    mustChangePassword: z.boolean().default(true),
  })
  .superRefine((input, context) => {
    if (input.password !== input.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,

        path: ["confirmPassword"],

        message: "Passwords do not match.",
      });
    }
  });

export const completePasswordChangeSchema = z.object({
  idToken: z.string().trim().min(1).max(10000),
});

export { passwordSchema };
