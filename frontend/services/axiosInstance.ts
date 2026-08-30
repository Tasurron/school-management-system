import axios from "axios";

export const TOKEN_STORAGE_KEY = "schoolms_token";
export const USER_STORAGE_KEY = "schoolms_user";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT (if any) to every outgoing request.
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On a 401 (expired/invalid token), clear storage and bounce to /login.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      // Avoid redirect loops if we're already on the login page.
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a human-readable message from an Axios error, handling both
 * ASP.NET's ProblemDetails validation shape ({ errors: { Field: [msg] } })
 * and simpler { detail } / { title } / { message } shapes.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data && typeof data === "object") {
      if ("errors" in data && data.errors && typeof data.errors === "object") {
        const messages = Object.values(data.errors as Record<string, string[]>)
          .flat()
          .filter(Boolean);
        if (messages.length > 0) return messages.join(" ");
      }
      // ASP.NET's ProblemDetails puts the specific reason in `detail` and only
      // a generic category (e.g. "Business rule violation") in `title` - prefer
      // detail so the user sees what actually went wrong, not just the category.
      if ("detail" in data && typeof data.detail === "string" && data.detail) {
        return data.detail;
      }
      if ("title" in data && typeof data.title === "string" && data.title) {
        return data.title;
      }
      if ("message" in data && typeof data.message === "string" && data.message) {
        return data.message;
      }
    }

    if (error.message) return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default axiosInstance;
