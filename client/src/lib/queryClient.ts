import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import api from "./api";

// Use the axios interceptor for API requests
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  try {
    const response =
      method.toLowerCase() === "get"
        ? await api.get(url)
        : method.toLowerCase() === "post"
          ? await api.post(url, data)
          : method.toLowerCase() === "put"
            ? await api.put(url, data)
            : method.toLowerCase() === "patch"
              ? await api.patch(url, data)
              : method.toLowerCase() === "delete"
                ? await api.delete(url)
                : await api.request({
                    method,
                    url,
                    data,
                  });

    return response.data;
  } catch (error: any) {
    console.error("API Request Error:", error);

    // Only show toast for non-404 errors
    if (error.response?.status !== 404) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }

    throw new Error(
      error?.response?.data?.message || error?.message || "Unknown error",
    );
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const response = await api.get(queryKey[0] as string);
      return response.data;
    } catch (error: any) {
      if (
        unauthorizedBehavior === "returnNull" &&
        error.response?.status === 401
      ) {
        return null;
      }

      // Don't show toast for 404 errors
      if (error.response?.status !== 404) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Something went wrong",
          variant: "destructive",
        });
      }

      throw new Error(
        error.response?.data?.message || error.message || "Unknown error",
      );
    }
  };

// Utility to safely cancel queries to avoid errors
export const cancelQuery = (queryKey: string) => {
  try {
    queryClient.cancelQueries({ queryKey: [queryKey] });
  } catch (error) {
    console.error("Error cancelling query:", error);
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute instead of Infinity
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: false,
    },
  },
});

// Export axios instance for direct use
export { api };
