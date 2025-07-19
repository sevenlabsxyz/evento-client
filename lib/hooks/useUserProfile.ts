import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { apiClient } from "../api/client";
import { authService } from "../services/auth";
import { useAuthStore } from "../stores/auth-store";
import { ApiResponse, UserDetails } from "../types/api";

// Query keys
const USER_PROFILE_QUERY_KEY = ["user", "profile"] as const;

/**
 * Hook to fetch and manage user profile data
 */
export function useUserProfile() {
  const { user, setUser, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  // Query to fetch current user profile
  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: authService.getCurrentUser,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error && typeof error === "object" && "message" in error) {
        const apiError = error as { message: string };
        if (
          apiError.message?.includes("401") ||
          apiError.message?.includes("Unauthorized")
        ) {
          return false;
        }
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Sync profile data with auth store
  React.useEffect(() => {
    if (profileData) {
      setUser(profileData);
    } else if (error) {
      // Clear auth on 401 errors
      const apiError = error as { message?: string };
      if (
        apiError.message?.includes("401") ||
        apiError.message?.includes("Unauthorized")
      ) {
        clearAuth();
      }
    }
  }, [profileData, error, setUser, clearAuth]);

  return {
    user: profileData || user,
    isLoading,
    error,
    refetch,
    isAuthenticated: !!profileData,
  };
}

/**
 * Hook to update user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (updates: Partial<UserDetails>) => {
      const response = await apiClient.patch<ApiResponse<UserDetails[]>>(
        "/v1/user",
        updates,
      );
      return response.data?.[0] || null;
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        // Update the query cache
        queryClient.setQueryData(USER_PROFILE_QUERY_KEY, updatedUser);
        // Update the auth store
        setUser(updatedUser);
      }
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
    },
  });
}

/**
 * Hook to upload profile image
 */
export function useUploadProfileImage() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await apiClient.post<ApiResponse<UserDetails[]>>(
        "/v1/user/details/image-upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data?.[0] || null;
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        // Update the query cache
        queryClient.setQueryData(USER_PROFILE_QUERY_KEY, updatedUser);
        // Update the auth store
        setUser(updatedUser);
      }
    },
    onError: (error) => {
      console.error("Profile image upload failed:", error);
    },
  });
}

/**
 * Hook to search for users
 */
export function useSearchUsers() {
  return useMutation({
    mutationFn: async (query: string) => {
      const response = await apiClient.get<ApiResponse<UserDetails[]>>(
        `/v1/user/search?q=${encodeURIComponent(query)}`,
      );
      return response.data || [];
    },
    onError: (error) => {
      console.error("User search failed:", error);
    },
  });
}

/**
 * Hook to follow/unfollow a user
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      action,
    }: {
      userId: string;
      action: "follow" | "unfollow";
    }) => {
      const response = await apiClient.post<ApiResponse<any>>(
        "/v1/user/follow",
        {
          user_id: userId,
          action,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["user", "followers"] });
      queryClient.invalidateQueries({ queryKey: ["user", "following"] });
    },
    onError: (error) => {
      console.error("Follow/unfollow failed:", error);
    },
  });
}

/**
 * Hook to get user's followers
 */
export function useUserFollowers(userId: string) {
  return useQuery({
    queryKey: ["user", "followers", userId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<any[]>>(
        `/v1/user/followers/list?id=${userId}`,
      );
      // Transform the API response to match UI expectations
      const transformedData = (response.data || []).map((item: any) => ({
        id: item.user_details?.id || item.follower_id,
        username: item.user_details?.username || "",
        name: item.user_details?.name || "",
        image: item.user_details?.image || "",
        verification_status: item.user_details?.verification_status || "",
      }));
      return transformedData;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get user's following
 */
export function useUserFollowing(userId: string) {
  return useQuery({
    queryKey: ["user", "following", userId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<any[]>>(
        `/v1/user/follows/list?id=${userId}`,
      );
      // Transform the API response to match UI expectations
      const transformedData = (response.data || []).map((item: any) => ({
        id: item.user_details?.id || item.followed_id,
        username: item.user_details?.username || "",
        name: item.user_details?.name || "",
        image: item.user_details?.image || "",
        verification_status: item.user_details?.verification_status || "",
      }));
      return transformedData;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get user's event count
 */
export function useUserEventCount(userId: string) {
  return useQuery({
    queryKey: ["user", "events", "count", userId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ count: number }>>(
        `/v1/user/events/count?id=${userId}`,
      );
      return response.data?.count || 0;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user profile by username
 */
export function useUserByUsername(username: string) {
  return useQuery({
    queryKey: ["user", "profile", "username", username],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserDetails>>(
        `/v1/user/details?username=${encodeURIComponent(username)}`,
      );
      return response.data || null;
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (user not found)
      if (error && typeof error === "object" && "status" in error) {
        const apiError = error as { status?: number };
        if (apiError.status === 404) return false;
      }
      return failureCount < 3;
    },
  });
}
