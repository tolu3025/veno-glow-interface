import { z } from "zod";
import { squadRequest } from "./squad-http.server";

export const accountResponseSchema = z.object({
  customer_identifier: z.string(), virtual_account_number: z.string().regex(/^\d{10}$/),
  bank_code: z.string(), first_name: z.string().min(1), last_name: z.string().min(1),
  account_name: z.string().optional(),
});

export function squadConfig() {
  const secret = process.env.SQUAD_SECRET_KEY;
  const merchant = process.env.SQUAD_MERCHANT_ID;
  if (!secret || !merchant) throw new Error("Account activation is temporarily unavailable.");
  return { secret, merchant, base: process.env.SQUAD_BASE_URL || "https://api-d.squadco.com" };
}

export async function retrieveSquadAccount(identifier: string) {
  const config = squadConfig();
  return squadRequest<unknown>(config.base, `/virtual-account/${encodeURIComponent(identifier)}`, config.secret);
}