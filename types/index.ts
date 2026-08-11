// ================================================================
// ARUSUVAI — TypeScript Types
// ================================================================

export type Role = 'client' | 'admin' | 'delivery_person';
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';
export type SkipStatus = 'pending' | 'approved' | 'rejected';
export type DeliveryStatus = 'pending' | 'assigned' | 'delivered' | 'not_available' | 'skipped' | 'pending_skip';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'not_started';
export type PaymentStatus = 'paid' | 'unpaid';

export interface User {
  id: string;
  name: string;
  phone_number: string;
  role: Role;
  location: string;
  username: string;
  delivery_note: string;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  client_id: string;
  type: string;
  amount: number;
  start_date: string;   // YYYY-MM-DD
  end_date: string;     // YYYY-MM-DD
  status: SubscriptionStatus;
  notes: string;
  subscribe_lunch?: boolean;
  subscribe_dinner?: boolean;
  subscribe_breakfast?: boolean;
  // computed on client:
  total_service_days?: number;
  remaining_service_days?: number;
}

export interface SkipRequest {
  id: string;
  client_id: string;
  client_name?: string;
  phone_number?: string;
  date: string;
  meal_type: MealType;
  status: SkipStatus;
  is_admin_initiated: boolean;
  requested_at: string;
  approved_at: string | null;
}

export interface DailyDelivery {
  id: string;
  client_id: string;
  client_name?: string;
  phone_number?: string;
  location?: string;
  delivery_note_client?: string;
  delivery_person_id: string | null;
  delivery_person_name?: string;
  date: string;
  meal_type: MealType;
  status: DeliveryStatus;
  skip_request_id: string | null;
  skip_req_id?: string;
  skip_status?: string;
  assigned_at: string | null;
  delivered_at: string | null;
  delivery_note: string;
}

export interface LocationFare {
  location: string;
  charge: number;
}

export interface Payment {
  id: string;
  client_id: string;
  client_name?: string;
  subscription_id: string | null;
  month: number;
  year: number;
  amount: number | null;
  status: PaymentStatus;
  settled_at: string | null;
}

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  location: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
