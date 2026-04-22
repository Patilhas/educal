import { z } from "zod";

export const loginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  staySignedIn: z.boolean().optional().default(false),
});

