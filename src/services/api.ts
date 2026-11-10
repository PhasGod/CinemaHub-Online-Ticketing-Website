const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api"
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "")

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${cleanEndpoint}`

  const headers = new Headers(options.headers || {})
  if (!["GET", "HEAD", "OPTIONS"].includes((options.method || "GET").toUpperCase())) {
    headers.set("X-CinemaHub-Request", "1")
  }
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  // Dual auth: support token from localStorage alongside cookies for cross-domain resilience
  const storedToken = typeof localStorage !== "undefined" ? localStorage.getItem("session_token") : null
  if (storedToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${storedToken}`)
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Ensure cookies (session_token) are sent with requests
  }

  const response = await fetch(url, config)

  let data: any
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Lỗi HTTP ${response.status}`
    const error = new Error(errorMsg)
    Object.assign(error, { data, status: response.status })
    throw error
  }

  return data as T
}
