import { apiClient } from "./client";
import type { Room } from "./rooms";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
  expiresAt?: string | null;
  room: Room;
}

export interface CreateBookingPayload {
  roomId: string;
  startTime: string;
  endTime: string;
}

export async function createBooking(payload: CreateBookingPayload) {
  const res = await apiClient.post("/bookings", payload);
  return res.data as Booking;
}

export async function holdBooking(payload: CreateBookingPayload) {
  const res = await apiClient.post("/bookings/hold", payload);
  return res.data as Booking;
}

export async function confirmBooking(bookingId: string) {
  const res = await apiClient.post(`/bookings/${bookingId}/confirm`);
  return res.data as Booking;
}

export async function cancelBooking(bookingId: string) {
  const res = await apiClient.post(`/bookings/${bookingId}/cancel`);
  return res.data as Booking;
}

// NEW: pagination support (server should accept ?page & ?limit)
export async function getMyBookings(params?: { page?: number; limit?: number }) {
  const res = await apiClient.get("/bookings/my", { params });
  return res.data as Booking[] | { data: Booking[]; total: number; page: number; hasMore: boolean };
}
