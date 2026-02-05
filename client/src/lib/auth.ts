export type AuthUser = {
  id: string;
  username: string;
  email: string;
  netSalaryUsd: number;
};

export type CurrentUser = AuthUser;

const CURRENT_USER_KEY = "fintrack_current_user";

export const PASSWORD_RULES = {
  minLength: 8,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  symbol: /[^A-Za-z0-9]/,
} as const;

export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidPassword = (password: string) =>
  password.length >= PASSWORD_RULES.minLength &&
  PASSWORD_RULES.uppercase.test(password) &&
  PASSWORD_RULES.lowercase.test(password) &&
  PASSWORD_RULES.number.test(password) &&
  PASSWORD_RULES.symbol.test(password);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "https://localhost:8443";
const API_PREFIX =
  process.env.NEXT_PUBLIC_API_PREFIX?.replace(/\/$/, "") ?? "/api/v1";

const getAuthApiUrl = (path: string) =>
  `${API_BASE_URL}${API_PREFIX}/auth/${path.replace(/^\//, "")}`;

const parseErrorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
};

const persistSession = (payload: AuthUser) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(payload));
};

const loadCurrentUser = () => {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
};

export const getCurrentUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return loadCurrentUser();
};

export const isAuthenticated = () => Boolean(getCurrentUser());

export const signOut = async () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    await fetch(getAuthApiUrl("logout"), {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Best effort only; still clear local profile cache.
  }

  localStorage.removeItem(CURRENT_USER_KEY);
};

export const login = async (input: { username: string; password: string }) => {
  const response = await fetch(getAuthApiUrl("login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as AuthUser;
  persistSession(payload);
  return payload;
};

export const register = async (input: {
  username: string;
  email: string;
  password: string;
  netSalaryUsd: number;
}) => {
  const response = await fetch(getAuthApiUrl("register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as AuthUser;
  persistSession(payload);
  return payload;
};

let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(getAuthApiUrl("refresh"), {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      await signOut();
      return false;
    }

    // Refresh endpoint returns 204 and rotates cookies.
    return true;
  })();

  const refreshed = await refreshPromise;
  refreshPromise = null;
  return refreshed;
};

export const authFetch = async (
  input: string,
  init: RequestInit = {},
  retry = true,
): Promise<Response> => {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      return response;
    }

    return authFetch(input, init, false);
  }

  return response;
};
