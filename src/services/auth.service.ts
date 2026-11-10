import { apiFetch } from "./api"
import { User, LoginPayload, RegisterPayload, UpdateProfilePayload } from "../types/auth"

export async function loginApi(payload: LoginPayload): Promise<{ message: string; user: User; token?: string }> {
  const res = await apiFetch<{ message: string; user: User; token?: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  if (res.token && typeof localStorage !== "undefined") {
    localStorage.setItem("session_token", res.token)
  }
  return res
}

export async function registerApi(payload: RegisterPayload): Promise<{ message: string; user: User; token?: string }> {
  const res = await apiFetch<{ message: string; user: User; token?: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  if (res.token && typeof localStorage !== "undefined") {
    localStorage.setItem("session_token", res.token)
  }
  return res
}

export async function logoutApi(): Promise<{ message: string }> {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("session_token")
  }
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

export async function forgotPasswordApi(email: string): Promise<{
  message: string
  email: string
  expiresInSeconds?: number
  devOtp?: string
}> {
  return apiFetch<{
    message: string
    email: string
    expiresInSeconds?: number
    devOtp?: string
  }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export async function resetPasswordApi(payload: {
  email: string
  otp: string
  newPassword: string
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
