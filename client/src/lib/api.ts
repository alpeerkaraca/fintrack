export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  path?: string;
  timestamp?: string;
};

export async function parseApiResponse<T>(response: unknown): Promise<T> {
  if (response instanceof Response) {
    if (!response.ok) {
      let message = "Request failed";
      try {
        const body = (await response.json()) as ApiResponse<unknown>;
        message = body.error || body.message || message;
      } catch {
        // Fall back to default message for non-JSON responses.
      }
      throw new Error(message);
    }

    const body = (await response.json()) as ApiResponse<T>;
    return parseApiResponse<T>(body);
  }

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
