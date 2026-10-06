import { apiFetch } from "./api"
import { User, LoginPayload, RegisterPayload, UpdateProfilePayload } from "../types/auth"

export async function loginApi(payload: LoginPayload): Promise<{ message: string; user: User }> {
  return apiFetch<{ message: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function registerApi(payload: RegisterPayload): Promise<{ message: string; user: User }> {
  return apiFetch<{ message: string; user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function logoutApi(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/logout", {
    method: "POST",
  })
}

export async function getMeApi(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/auth/me", {
    method: "GET",
  })
}

export async function updateProfileApi(payload: UpdateProfilePayload): Promise<{ message: string; user: User }> {
  return apiFetch<{ message: string; user: User }>("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}
