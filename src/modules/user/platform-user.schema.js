import { z } from "zod";

import { USER_STATUS } from "@/constants/roles";

export const updatePlatformUserSchema = z.object({
  displayName: z.string().trim().min(2).max(150).optional(),

  phone: z.union([z.string().trim().max(50), z.null()]).optional(),

  status: z
    .enum([USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.SUSPENDED])
    .optional(),

  isSuperAdmin: z.boolean().optional(),

  /*
   * Avatar is intentionally excluded.
   *
   * SUPERADMIN may manage account information,
   * role and status, but only the account owner
   * may change their own avatar.
   */
});

export const platformUserIdSchema = z.string().trim().min(1).max(200);
