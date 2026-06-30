import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CustomerInfo, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import { RevenueCatService } from '../services/RevenueCatService';
import { router } from 'expo-router';
import { REVENUECAT_CONSTANTS } from '../services/revenuecat.constants';
import { useAuthStore } from '@/features/auth/store/authStore';

export interface SubscriptionState {
  isPremium: boolean;
  offerings: PurchasesOffering | null;
  activeSubscription: string | null;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  error: Error | null;
  isInitialized: boolean;
  purchaseStatus: 'idle' | 'purchasing' | 'success' | 'error';
  restoreStatus: 'idle' | 'restoring' | 'success' | 'error';
}

export interface RevenueCatContextType extends SubscriptionState {
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  showPaywall: () => void;
}

const initialState: SubscriptionState = {
  isPremium: false,
  offerings: null,
  activeSubscription: null,
  customerInfo: null,
  loading: true,
  error: null,
  isInitialized: false,
  purchaseStatus: 'idle',
  restoreStatus: 'idle',
};

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};

export const RevenueCatProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SubscriptionState>(initialState);

  const updateState = (updates: Partial<SubscriptionState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleCustomerInfo = (customerInfo: CustomerInfo) => {
    console.log('[RevenueCatProvider] handleCustomerInfo: Processing customer info...');
    const targetEntitlementId = REVENUECAT_CONSTANTS.ENTITLEMENT_ID;
    console.log(`[RevenueCatProvider] - Target entitlement ID check: '${targetEntitlementId}'`);
    
    const activeEntitlementKeys = customerInfo?.entitlements?.active 
      ? Object.keys(customerInfo.entitlements.active) 
      : [];
    console.log('[RevenueCatProvider] - Active entitlements found in CustomerInfo:', activeEntitlementKeys);

    const isPremium = typeof customerInfo?.entitlements?.active?.[targetEntitlementId] !== 'undefined' || activeEntitlementKeys.length > 0;
    
    // Warning if the user has active entitlements but none match the app's target entitlement ID
    if (!isPremium && activeEntitlementKeys.length > 0) {
      console.warn(
        `[RevenueCatProvider] ENTITLEMENT CONFIGURATION MISMATCH DETECTED!\n` +
        `- User has active entitlements: ${JSON.stringify(activeEntitlementKeys)}.\n` +
        `- The app is checking for entitlement ID '${targetEntitlementId}'.\n` +
        `- Because this ID doesn't match, premium features will be LOCKED.\n` +
        `- Action required: Align ENTITLEMENT_ID in src/services/revenuecat/revenuecat.constants.ts to match one of your RevenueCat active entitlements!`
      );
    }
    
    const matchedKey = typeof customerInfo?.entitlements?.active?.[targetEntitlementId] !== 'undefined'
      ? targetEntitlementId
      : activeEntitlementKeys[0];

    const activeSubscription = isPremium && matchedKey
      ? customerInfo?.entitlements?.active?.[matchedKey]?.productIdentifier 
      : null;
    
    console.log(`[RevenueCatProvider] Subscription status updated -> IsPremium: ${isPremium}, Active Product ID: ${activeSubscription || 'None'}`);

    updateState({
      isPremium,
      activeSubscription: activeSubscription || null,
      customerInfo: customerInfo || null,
    });
  };

  const { user } = useAuthStore();

  const initializeAndSync = async () => {
    try {
      console.log(`[RevenueCatProvider] initializeAndSync starting. Current Supabase user ID: ${user?.id || 'anonymous'}`);
      updateState({ loading: true, error: null });
      
      // 1. Initialize RevenueCat (will configure SDK once)
      await RevenueCatService.initialize(user?.id);
      console.log('[RevenueCatProvider] Live RevenueCat SDK initialized successfully.');
      updateState({ isInitialized: true });

      // 2. Run the user sync detection flow
      console.log('[RevenueCatProvider] Running syncRevenueCatUser...');
      const { customerInfo: syncedInfo, switched } = await RevenueCatService.syncRevenueCatUser();
      console.log(`[RevenueCatProvider] syncRevenueCatUser result -> Switched User: ${switched}, CustomerInfo Received: ${!!syncedInfo}`);

      if (switched) {
        if (syncedInfo) {
          handleCustomerInfo(syncedInfo);
        } else {
          console.log('[RevenueCatProvider] User switch resulted in logged-out state (no CustomerInfo). Clearing subscription state.');
          updateState({
            isPremium: false,
            activeSubscription: null,
            customerInfo: null,
          });
        }
      } else {
        // No switch detected, fetch existing customer info
        console.log('[RevenueCatProvider] No user switch. Fetching existing customer info...');
        const customerInfo = await RevenueCatService.getCustomerInfo();
        handleCustomerInfo(customerInfo);
      }

      // 3. Load active offerings
      console.log('[RevenueCatProvider] Fetching active offerings...');
      const offerings = await RevenueCatService.getOfferings();
      console.log(`[RevenueCatProvider] getOfferings returned ${offerings.length} offerings.`);
      if (offerings.length > 0) {
        console.log(`[RevenueCatProvider] Setting active offering: ${offerings[0].identifier}`);
        updateState({ offerings: offerings[0] });
      } else {
        console.warn(
          '[RevenueCatProvider] No offerings found! The offerings state in the provider will remain null. ' +
          'Please ensure offerings are configured in the RevenueCat dashboard and not filtered out.'
        );
        updateState({ offerings: null });
      }

    } catch (error: any) {
      console.error('[RevenueCatProvider] Failed to initialize/sync RevenueCat:', error);
      updateState({ error });
    } finally {
      updateState({ loading: false });
    }
  };

  useEffect(() => {
    initializeAndSync();
  }, [user?.id]);


  const purchasePackage = async (pkg: PurchasesPackage) => {
    try {
      updateState({ purchaseStatus: 'purchasing', error: null });
      const customerInfo = await RevenueCatService.purchasePackage(pkg);
      handleCustomerInfo(customerInfo);
      updateState({ purchaseStatus: 'success' });
    } catch (error: any) {
      if (!error.userCancelled) {
        updateState({ purchaseStatus: 'error', error });
      } else {
        updateState({ purchaseStatus: 'idle' });
      }
      throw error;
    }
  };

  const restorePurchases = async () => {
    try {
      updateState({ restoreStatus: 'restoring', error: null });
      const customerInfo = await RevenueCatService.restorePurchases();
      handleCustomerInfo(customerInfo);
      updateState({ restoreStatus: 'success' });
    } catch (error: any) {
      updateState({ restoreStatus: 'error', error });
      throw error;
    }
  };

  const refreshSubscription = async () => {
    try {
      updateState({ loading: true, error: null });
      const customerInfo = await RevenueCatService.getCustomerInfo();
      handleCustomerInfo(customerInfo);
    } catch (error: any) {
      updateState({ error });
    } finally {
      updateState({ loading: false });
    }
  };

  const showPaywall = () => {
    router.push('/paywall');
  };

  const contextValue: RevenueCatContextType = {
    ...state,
    purchasePackage,
    restorePurchases,
    refreshSubscription,
    showPaywall,
  };

  return (
    <RevenueCatContext.Provider value={contextValue}>
      {children}
    </RevenueCatContext.Provider>
  );
};
