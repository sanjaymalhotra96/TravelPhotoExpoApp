export const REVENUECAT_CONSTANTS = {
  APPLE_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || '',
  GOOGLE_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || '',
  ENTITLEMENT_ID: 'monthly', // Corrected from 'monthy' to match standard RevenueCat dashboard configuration
};
