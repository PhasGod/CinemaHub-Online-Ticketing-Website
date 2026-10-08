const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`

  const headers = new Headers(options.headers || {})
  if (!["GET", "HEAD", "OPTIONS"].includes((options.method || "GET").toUpperCase())) {
    headers.set("X-CinemaHub-Request", "1")
  }
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
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
    const error = data?.error || data?.message || `Lỗi HTTP ${response.status}`
    throw new Error(error)
  }

  return data as T
}
