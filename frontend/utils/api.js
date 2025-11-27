import { toast } from "react-toastify";

export function api(route) {
  return `${process.env.NEXT_PUBLIC_API_URL}/api${route}`;
}

export async function handleApiResponse(
  response,
  onSuccessCallback,
  onErrorCallback
) {
  try {
    if (response.ok) {
      const result = await response.json();
      if (onSuccessCallback) {
        onSuccessCallback(result);
      } else {
        toast.success("Request was successful");
      }
      return result;
    } else {
      const errorText = await response.text();
      let errorMessage = "Something went wrong. Please try again.";

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      const error = new Error(errorMessage);
      error.handled = true; // Mark as already handled to prevent duplicate toasts

      if (onErrorCallback) {
        onErrorCallback(errorMessage);
      } else {
        toast.error(errorMessage);
      }

      throw error;
    }
  } catch (error) {
    // If error was already handled (marked with handled property), just rethrow
    if (error.handled) {
      throw error;
    }

    // This catch block only handles unexpected errors (e.g., JSON parsing errors)
    const errorMessage =
      error.message ||
      "An error occurred during the request. Please try again.";

    const handledError = new Error(errorMessage);
    handledError.handled = true;

    if (onErrorCallback) {
      onErrorCallback(errorMessage);
    } else {
      toast.error(errorMessage);
    }
    throw handledError;
  }
}

export async function makePostRequest(
  url,
  body,
  optionFields = {},
  onSuccessCallback,
  onErrorCallback
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${url}`, {
      ...optionFields,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return await handleApiResponse(
      response,
      onSuccessCallback,
      onErrorCallback
    );
  } catch (error) {
    // Only show toast for network errors that haven't been handled yet
    // Errors from handleApiResponse are already handled and marked with error.handled
    if (!error.handled) {
      console.error("API request error:", error.message);
      if (!onErrorCallback) {
        toast.error(
          "Network error. Please check your connection and try again."
        );
      }
    }
    throw error;
  }
}

export async function makeGetRequest(
  url,
  optionFields = {},
  onSuccessCallback,
  onErrorCallback
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${url}`, {
      ...optionFields,
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return await handleApiResponse(
      response,
      onSuccessCallback,
      onErrorCallback
    );
  } catch (error) {
    // Only show toast for network errors that haven't been handled yet
    // Errors from handleApiResponse are already handled and marked with error.handled
    if (!error.handled) {
      console.error("API request error:", error);
      if (!onErrorCallback) {
        toast.error(
          "Network error. Please check your connection and try again."
        );
      }
    }
    throw error;
  }
}
