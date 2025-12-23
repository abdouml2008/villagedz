/**
 * React Query caching configuration for optimized data fetching
 * Reduces unnecessary API calls and improves performance
 */

export const queryConfig = {
  // Static data that rarely changes (categories, settings)
  static: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  // Dynamic data that changes moderately (products, reviews)
  dynamic: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  },
  
  // Realtime data that needs frequent updates (orders, cart)
  realtime: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
  
  // Social links and footer data
  social: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  }
} as const;
