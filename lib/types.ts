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
  created_at: string;
  updated_at: string;
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
  created_at: string;
};
