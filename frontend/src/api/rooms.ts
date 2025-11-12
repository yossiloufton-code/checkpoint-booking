import { apiClient } from "./client";
import { ApiResponse } from "./types";

export interface Room {
  id: string;
  name: string;       
  location?: string;
  capacity: number;
  amenities?: Record<string, any>;
  availableFrom?: string | null;
  availableTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getRooms(params: {
  location?: string;
  minCapacity?: number;
  startTime?: string;
  endTime?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<Room>>("/rooms", { params });
  return data;
}

export async function getRoomById(id: string) {
  const res = await apiClient.get<Room>(`/rooms/${id}`);
  return res.data;
}
