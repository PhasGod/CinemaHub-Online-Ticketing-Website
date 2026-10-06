export type UserRole = "customer" | "staff" | "admin"

export interface User {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: UserRole
  isActive: boolean
}

export interface RegisterPayload {
  email: string
  password: string
  fullName: string
  phone?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface UpdateProfilePayload {
  fullName: string
  phone?: string
}
