import { z } from "zod";

import { COMPANY_ROLES } from "@/constants/roles";

import { MEMBERSHIP_STATUS } from "@/constants/membership";

const companyRoleSchema = z.enum([COMPANY_ROLES.ADMIN, COMPANY_ROLES.EDITOR]);

const groupIdsSchema = z
  .array(z.string().trim().min(1).max(200))
  .max(50)
  .transform((values) => Array.from(new Set(values)));

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

  groupIds: groupIdsSchema.optional().default([]),

  /*
   * Avatar is intentionally excluded.
   * Admins cannot assign another user's avatar.
   */
});

export const updateMemberSchema = z.object({
  displayName: z.string().trim().min(2).max(150).optional(),

  role: companyRoleSchema.optional(),

  status: z
    .enum([MEMBERSHIP_STATUS.ACTIVE, MEMBERSHIP_STATUS.INACTIVE])
    .optional(),

  permissions: z.array(z.string()).optional(),

  groupIds: groupIdsSchema.optional(),

  /*
   * Avatar is intentionally excluded.
   * Only /api/v1/users/me/profile may update it.
   */
});

export const setCompanyAccessSchema = z.discriminatedUnion("access", [
  z.object({
    access: z.literal("NO_ACCESS"),
  }),

  z.object({
    access: companyRoleSchema,

    permissions: z.array(z.string()).optional().default([]),

    groupIds: groupIdsSchema.optional().default([]),
  }),
]);

export const uidSchema = z.string().trim().min(1).max(200);

export const assignExistingMemberSchema = z.object({
  role: companyRoleSchema.default(COMPANY_ROLES.EDITOR),

  permissions: z.array(z.string()).default([]),

  groupIds: groupIdsSchema.optional().default([]),
});
