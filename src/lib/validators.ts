import { z } from "zod";

// Shared sanitizer — strips HTML tags and trims
const sanitize = (val: string) => val.replace(/<[^>]*>/g, "").trim();

const sanitizedString = (min: number, max: number, label: string) =>
  z.string().transform(sanitize).pipe(
    z.string().min(min, `${label} is required`).max(max, `${label} must be less than ${max} characters`)
  );

// ── Registration ──
export const registerSchema = z.object({
  full_name: sanitizedString(2, 100, "Full name"),
  email: z.string().trim().email("Invalid email address").max(255),
  phone_number: z.string().trim().regex(/^(\+234|0)[0-9]{10}$/, "Enter a valid Nigerian phone number"),
  university: z.string().min(1, "Select your university"),
  matric_number: sanitizedString(2, 30, "Matric number"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

// ── Login ──
export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

// ── Send Money ──
export const sendMoneySchema = z.object({
  amount: z.number().positive("Amount must be positive").max(100_000, "Daily limit is ₦100,000"),
  note: z.string().max(100, "Note too long").optional(),
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d{4}$/, "PIN must be numeric"),
});

// ── Collection ──
export const createCollectionSchema = z.object({
  title: sanitizedString(2, 100, "Title"),
  description: z.string().max(500, "Description too long").optional().transform(v => v ? sanitize(v) : v),
  target_amount: z.number().positive("Target amount must be positive").max(10_000_000),
  amount_per_person: z.number().positive().max(10_000_000).nullable().optional(),
  category: z.enum(["dues", "materials", "event", "other"]),
});

// ── Errand ──
export const createErrandSchema = z.object({
  title: sanitizedString(2, 100, "Title"),
  description: z.string().max(500).optional().transform(v => v ? sanitize(v) : v),
  zone: z.string().min(1, "Select a zone"),
  amount: z.number().min(100, "Minimum amount is ₦100").max(500_000),
  urgency: z.enum(["standard", "urgent"]),
});

// ── Ajo Group ──
export const createAjoSchema = z.object({
  title: sanitizedString(2, 100, "Group name"),
  description: z.string().max(500).optional().transform(v => v ? sanitize(v) : v),
  contribution_amount: z.number().min(100, "Minimum contribution is ₦100").max(1_000_000),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  total_slots: z.number().int().min(2, "At least 2 slots").max(50, "Maximum 50 slots"),
  order_type: z.enum(["random_ballot", "admin_assigned", "first_come"]),
  min_kyc_level: z.number().int().min(1).max(3),
  is_public: z.boolean(),
});

// ── Event ──
export const createEventSchema = z.object({
  title: sanitizedString(2, 100, "Event title"),
  description: z.string().max(500).optional().transform(v => v ? sanitize(v) : v),
  venue: sanitizedString(2, 200, "Venue"),
  event_date: z.string().min(1, "Event date is required"),
  end_date: z.string().optional(),
  category: z.string().min(1),
  image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  ticket_types: z.array(z.object({
    name: sanitizedString(1, 50, "Ticket name"),
    price: z.number().min(0),
    quantity: z.number().int().min(1, "At least 1 ticket"),
    description: z.string().max(200).optional(),
  })).min(1, "At least one ticket type"),
});

// ── Withdrawal ──
export const withdrawalSchema = z.object({
  amount: z.number().min(100, "Minimum withdrawal is ₦100").max(2_000_000),
  bank_code: z.string().min(1, "Select a bank"),
  account_number: z.string().regex(/^\d{10}$/, "Account number must be 10 digits"),
  account_name: z.string().min(1, "Account not resolved"),
  withdrawal_type: z.enum(["standard", "instant"]),
  pin: z.string().length(4).regex(/^\d{4}$/),
});

// ── Airtime ──
export const airtimeSchema = z.object({
  phone: z.string().regex(/^(\+234|0)[0-9]{10}$/, "Enter a valid Nigerian phone number"),
  amount: z.number().min(50, "Minimum is ₦50").max(50_000, "Maximum is ₦50,000"),
  network: z.enum(["mtn", "airtel", "glo", "9mobile"]),
  pin: z.string().length(4).regex(/^\d{4}$/),
});

// ── Merchant Onboarding ──
export const merchantOnboardingSchema = z.object({
  business_name: sanitizedString(2, 100, "Business name"),
  category: z.string().min(1, "Select a category"),
  description: z.string().max(500).optional().transform(v => v ? sanitize(v) : v),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
