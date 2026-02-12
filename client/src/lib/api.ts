export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  path?: string;
  timestamp?: string;
};

export function parseApiResponse<T>(response: unknown): T {
  if (!response || typeof response !== "object") {
    throw new Error("Invalid API response");
  }

  const apiResponse = response as ApiResponse<T>;

  if (!apiResponse.success) {
    throw new Error(apiResponse.error || apiResponse.message || "Request failed");
  }

  if (apiResponse.data === undefined || apiResponse.data === null) {
    throw new Error("No data in response");
  }

  return apiResponse.data;
}

export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as ApiResponse<unknown>).success === "boolean"
  );
}
