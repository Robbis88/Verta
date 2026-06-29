import type { Plan, BookingSource } from "@/lib/constants";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  plan: Plan;
  extra_properties_count: number;
  stripe_customer_id: string | null;
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
  created_at: string;
};
