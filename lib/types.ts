import type { Plan, BookingSource } from "@/lib/constants";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  plan: Plan;
  extra_properties_count: number;
  stripe_customer_id: string | null;
  // Stripe Connect (utbetaling til eier ved gjeste-betaling) — se sql/027.
  stripe_connect_id?: string | null;
  payouts_enabled?: boolean;
};

export type IcalUrl = { url: string; source: string };

export type Property = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  address: string | null;
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  max_guests: number | null;
  base_nightly_rate?: number | null;
  cleaning_fee?: number | null;
  // 'instant' = bestill+betal med en gang, 'request' = eier godkjenner først.
  booking_mode?: "instant" | "request";
  images?: string[];
  access_info?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  house_rules?: string | null;
  checkout_info?: string | null;
  ical_urls?: IcalUrl[];
  created_at: string;
  updated_at: string;
};

export type Boost = {
  id: string;
  property_id: string;
  status: string;
  budget_nok: number;
  platform: string;
  start_date: string;
  end_date: string;
  ai_generated_text: string | null;
  user_approved_text: string | null;
  utm_campaign_id: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  total_price: number | null;
  nights: number | null;
  source: BookingSource;
  status: string;
  access_code?: string | null;
  access_code_id?: string | null;
  guest_token?: string;
  // Gjeste-betaling (Stripe Connect) — se sql/027.
  payment_status?: "pending" | "paid" | "refunded" | "failed" | null;
  stripe_session_id?: string | null;
  stripe_payment_intent?: string | null;
  amount_total?: number | null;
  application_fee?: number | null;
  hold_expires_at?: string | null;
  // Forespørsel-booking — se sql/028.
  num_guests?: number | null;
  guest_message?: string | null;
  approved_at?: string | null;
  deposit_amount?: number | null;
  remaining_amount?: number | null;
  remaining_paid?: boolean;
  remaining_session_id?: string | null;
  remaining_payment_intent?: string | null;
  created_at: string;
};
