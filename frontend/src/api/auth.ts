// src/api/auth.ts
import { apiClient } from "./client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "GUEST" | "MEMBER";
}

export interface AuthResponse {
  user: User;
  token: string;
}

export async function login(email: string, password: string) {
  const res = await apiClient.post<AuthResponse>("/auth/login", {
    email,
    password
  });
  return res.data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: "GUEST" | "MEMBER"
) {
  const res = await apiClient.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
    role
  });
  return res.data;
}

export async function fetchMe() {
  const res = await apiClient.get<User>("/auth/currentUser");
  return res.data;
}

export async function loginGuest() {
  const res = await apiClient.post<AuthResponse>("/auth/guest");
  return res.data;
}
