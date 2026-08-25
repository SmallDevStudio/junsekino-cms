import { z } from "zod";

import { DASHBOARD_RANGES } from "@/constants/dashboard";

export const dashboardRangeSchema = z.enum(DASHBOARD_RANGES);
