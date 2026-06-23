import { RevenueCatService } from './RevenueCatService';
import { REVENUECAT_CONSTANTS } from './revenuecat.constants';

export { RevenueCatService, REVENUECAT_CONSTANTS };

/**
 * Checks if a RevenueCat purchase error was due to the user cancelling.
 * @param error The error object from the purchase attempt.
 */
export const isRevenueCatPurchaseCancelled = (error: any): boolean => {
  return !!error?.userCancelled;
};
