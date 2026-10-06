import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { User, LoginPayload, RegisterPayload, UpdateProfilePayload } from "../types/auth"
import { getMeApi, loginApi, logoutApi, registerApi, updateProfileApi } from "../services/auth.service"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>
  clearError: () => void
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentUser = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getMeApi()
      setUser(res.user)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  const handleLogin = async (payload: LoginPayload): Promise<User> => {
    setError(null)
    try {
      const res = await loginApi(payload)
      setUser(res.user)
      return res.user
    } catch (err: any) {
      const msg = err?.message || "Đăng nhập thất bại"
      setError(msg)
      throw new Error(msg)
    }
  }

  const handleRegister = async (payload: RegisterPayload): Promise<User> => {
    setError(null)
    try {
      const res = await registerApi(payload)
      setUser(res.user)
      return res.user
    } catch (err: any) {
      const msg = err?.message || "Đăng ký thất bại"
      setError(msg)
      throw new Error(msg)
    }
  }

  const handleLogout = async (): Promise<void> => {
    setError(null)
    try {
      await logoutApi()
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null)
    }
  }

  const handleUpdateProfile = async (payload: UpdateProfilePayload): Promise<User> => {
    setError(null)
    try {
      const res = await updateProfileApi(payload)
      setUser(res.user)
      return res.user
    } catch (err: any) {
      const msg = err?.message || "Cập nhật thông tin thất bại"
      setError(msg)
      throw new Error(msg)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        clearError: () => setError(null),
        refetchUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
