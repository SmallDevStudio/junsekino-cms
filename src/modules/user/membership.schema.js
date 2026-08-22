import { z } from "zod";

import { COMPANY_ROLES } from "@/constants/roles";

import { MEMBERSHIP_STATUS } from "@/constants/membership";

const companyRoleSchema = z.enum([COMPANY_ROLES.ADMIN, COMPANY_ROLES.EDITOR]);

export const createMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),

  displayName: z.string().trim().min(2).max(150),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .max(128),

  role: companyRoleSchema,

  permissions: z.array(z.string()).default([]),
});

export const updateMemberSchema = z.object({
  displayName: z.string().trim().min(2).max(150).optional(),

  role: companyRoleSchema.optional(),

  status: z
    .enum([MEMBERSHIP_STATUS.ACTIVE, MEMBERSHIP_STATUS.INACTIVE])
    .optional(),

  permissions: z.array(z.string()).optional(),
});

export const uidSchema = z.string().trim().min(1).max(200);
