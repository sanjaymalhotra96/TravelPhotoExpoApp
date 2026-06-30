import Purchases, { CustomerInfo, PurchasesOffering, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { IRevenueCatAdapter } from './RevenueCatAdapter';
import { REVENUECAT_CONSTANTS } from './revenuecat.constants';
import { supabase } from '@/shared/lib/supabase';
import { StorageService } from '@/shared/services/storage';

class RevenueCatServiceImpl implements IRevenueCatAdapter {
  private static instance: RevenueCatServiceImpl;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): RevenueCatServiceImpl {
    if (!RevenueCatServiceImpl.instance) {
      RevenueCatServiceImpl.instance = new RevenueCatServiceImpl();
    }
    return RevenueCatServiceImpl.instance;
  }

  public async initialize(appUserID?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('[RevenueCatService] initialize: Already initialized. Current App User ID:', appUserID || 'anonymous');
      return;
    }

    const apiKey = Platform.select({
      ios: REVENUECAT_CONSTANTS.APPLE_API_KEY,
      android: REVENUECAT_CONSTANTS.GOOGLE_API_KEY,
    });

    const maskKey = (key?: string): string => {
      if (!key) return 'undefined';
      if (key.length <= 8) return '***';
      return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
    };

    const maskedKey = maskKey(apiKey);
    console.log(`[RevenueCatService] Initializing live RevenueCat SDK on Platform: ${Platform.OS} with API key: ${maskedKey}`);
    console.log(`[RevenueCatService] Initial App User ID parameter: ${appUserID || 'anonymous'}`);

    try {
      if (__DEV__) {
        console.log('[RevenueCatService] Enabling verbose debug logs in RevenueCat SDK.');
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }
      
      if (appUserID) {
        console.log(`[RevenueCatService] Calling Purchases.configure with appUserID: ${appUserID}`);
        await Purchases.configure({ apiKey: apiKey!, appUserID });
      } else {
        console.log('[RevenueCatService] Calling Purchases.configure with anonymous user.');
        await Purchases.configure({ apiKey: apiKey! });
      }
      
      this.isInitialized = true;
      console.log('[RevenueCatService] Live Native RevenueCat SDK initialization completed successfully.');
    } catch (err: any) {
      console.error('[RevenueCatService] CRITICAL: Failed to configure live RevenueCat SDK:', err);
      console.error('  - Error Message:', err?.message);
      console.error('  - Error Code:', err?.code);
      console.error('  - Underlying Error Message:', err?.underlyingErrorMessage);
      throw err;
    }
  }

  public async getCustomerInfo(): Promise<CustomerInfo> {
    this.ensureInitialized();
    console.log('[RevenueCatService] getCustomerInfo: Fetching current customer info from live RevenueCat SDK...');
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('[RevenueCatService] getCustomerInfo: Customer info retrieved successfully.');
      console.log(`[RevenueCatService] - Original App User ID: ${customerInfo.originalAppUserId}`);
      console.log(`[RevenueCatService] - Active Entitlements:`, JSON.stringify(customerInfo.entitlements.active, null, 2));
      console.log(`[RevenueCatService] - Active Subscriptions:`, JSON.stringify(customerInfo.activeSubscriptions, null, 2));
      return customerInfo;
    } catch (error: any) {
      console.error('[RevenueCatService] error in getCustomerInfo from SDK:');
      console.error('  - Error Message:', error?.message);
      console.error('  - Error Code:', error?.code);
      console.error('  - Underlying Error Message:', error?.underlyingErrorMessage);
      throw error;
    }
  }

  public async getOfferings(): Promise<PurchasesOffering[]> {
    this.ensureInitialized();
    console.log('[RevenueCatService] getOfferings: Requesting live offerings from RevenueCat SDK...');
    try {
      const offerings = await Purchases.getOfferings();
      console.log('[RevenueCatService] getOfferings: Raw offerings response received.');

      if (!offerings) {
        console.warn('[RevenueCatService] getOfferings: Offerings response is null or undefined.');
        return [];
      }

      const result: PurchasesOffering[] = [];
      if (offerings.current) {
        console.log(`[RevenueCatService] getOfferings: Found active current offering -> ID: ${offerings.current.identifier}`);
        result.push(offerings.current);
      } else {
        console.warn('[RevenueCatService] getOfferings: offerings.current is null. No default offering is set in the RevenueCat dashboard.');
      }

      if (offerings.all && Object.keys(offerings.all).length > 0) {
        console.log(`[RevenueCatService] getOfferings: Found all offering keys in dashboard: ${Object.keys(offerings.all).join(', ')}`);
        if (!offerings.current) {
          const firstOfferingKey = Object.keys(offerings.all)[0];
          const fallbackOffering = offerings.all[firstOfferingKey];
          if (fallbackOffering) {
            console.log(`[RevenueCatService] getOfferings: Falling back to first available offering -> ID: ${firstOfferingKey}`);
            result.push(fallbackOffering);
          }
        }
      } else {
        console.warn('[RevenueCatService] getOfferings: offerings.all is empty. There are no offerings configured or published on the RevenueCat dashboard.');
      }

      if (result.length === 0) {
        console.warn(
          '[RevenueCatService] getOfferings: No offerings returned to provider.\n' +
          'Please verify in the RevenueCat Dashboard:\n' +
          '1. You have configured an Offering and linked Packages to it.\n' +
          '2. Those Packages contain valid Products (like "monthly:monthly").\n' +
          '3. Under Google Play Console, the corresponding Subscriptions are active.\n' +
          '4. The Service Account credentials uploaded to RevenueCat are correct.'
        );
      } else {
        result.forEach(offering => {
          console.log(`[RevenueCatService] Live Offering ID: ${offering.identifier}, Description: ${offering.serverDescription}`);
          if (offering.availablePackages && offering.availablePackages.length > 0) {
            offering.availablePackages.forEach((pkg, index) => {
              console.log(
                `  - Package [${index}]: Identifier: ${pkg.identifier}, PackageType: ${pkg.packageType}, ` +
                `Product ID: ${pkg.product?.identifier}, Price: ${pkg.product?.priceString}`
              );
            });
          } else {
            console.warn(`[RevenueCatService] Offering ${offering.identifier} has NO available packages.`);
          }
        });
      }

      return result;
    } catch (error: any) {
      console.warn('[RevenueCatService] Warning fetching offerings from RevenueCat SDK:');
      console.warn('  - Error Message:', error?.message);
      console.warn('  - Error Code:', error?.code);
      console.warn('  - Note: This is an expected RevenueCat Dashboard setup warning (Error Code 23).');
      console.warn('  - To enable live offerings, ensure your Google Play product is registered under Products and linked to your Offering.');
      return [];
    }
  }

  public async purchasePackage(packageToBuy: any): Promise<CustomerInfo> {
    this.ensureInitialized();
    console.log(`[RevenueCatService] purchasePackage: Initiating live purchase for package: ${packageToBuy.identifier}, Product ID: ${packageToBuy.product?.identifier}`);
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
      console.log('[RevenueCatService] purchasePackage: Purchase succeeded. Live customer info updated.');
      console.log('[RevenueCatService] Updated active entitlements:', JSON.stringify(customerInfo.entitlements.active, null, 2));
      return customerInfo;
    } catch (error: any) {
      console.error('[RevenueCatService] error during purchasePackage:');
      console.error('  - Error Message:', error?.message);
      console.error('  - Error Code:', error?.code);
      console.error('  - Underlying Error Message:', error?.underlyingErrorMessage);
      console.error('  - User Cancelled:', error?.userCancelled);
      throw error;
    }
  }

  public async restorePurchases(): Promise<CustomerInfo> {
    this.ensureInitialized();
    console.log('[RevenueCatService] restorePurchases: Initiating live restore purchases...');
    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('[RevenueCatService] restorePurchases: Restore succeeded.');
      console.log('[RevenueCatService] Restored active entitlements:', JSON.stringify(customerInfo.entitlements.active, null, 2));
      return customerInfo;
    } catch (error: any) {
      console.error('[RevenueCatService] error during restorePurchases:');
      console.error('  - Error Message:', error?.message);
      console.error('  - Error Code:', error?.code);
      console.error('  - Underlying Error Message:', error?.underlyingErrorMessage);
      throw error;
    }
  }

  public async logOut(): Promise<CustomerInfo> {
    this.ensureInitialized();
    console.log('[RevenueCatService] logOut: Logging out current active user from RevenueCat SDK...');
    try {
      const isAnon = await Purchases.isAnonymous();
      if (isAnon) {
        console.log('[RevenueCatService] logOut: Current user is anonymous. Skipping SDK logOut call.');
        return await Purchases.getCustomerInfo();
      }
      const customerInfo = await Purchases.logOut();
      console.log('[RevenueCatService] logOut: Live Log out complete.');
      return customerInfo;
    } catch (error: any) {
      console.warn('[RevenueCatService] logOut skipped/handled notice:', error?.message || error);
      return await Purchases.getCustomerInfo();
    }
  }

  public async login(appUserID: string): Promise<{ customerInfo: CustomerInfo; created: boolean }> {
    this.ensureInitialized();
    console.log(`[RevenueCatService] login: Logging in user to RevenueCat SDK with ID: ${appUserID}...`);
    try {
      const result = await Purchases.logIn(appUserID);
      console.log(`[RevenueCatService] login: User logged in to RevenueCat SDK. Created new user: ${result.created}.`);
      console.log(`[RevenueCatService] Active entitlements after login:`, JSON.stringify(result.customerInfo.entitlements.active, null, 2));
      return result;
    } catch (error: any) {
      console.error(`[RevenueCatService] error logging in user ${appUserID} to RevenueCat SDK:`);
      console.error('  - Error Message:', error?.message);
      console.error('  - Error Code:', error?.code);
      console.error('  - Underlying Error Message:', error?.underlyingErrorMessage);
      throw error;
    }
  }

  public async checkUserSwitch(): Promise<{
    switched: boolean;
    currentUserId: string | null;
    lastUserId: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;
      const lastUserId = StorageService.getString('last_logged_in_user_id') || null;

      const switched = currentUserId !== lastUserId;
      console.log(`[RevenueCatService] checkUserSwitch - Current Supabase User: ${currentUserId}, Last Logged In: ${lastUserId}, Switched: ${switched}`);
      return {
        switched,
        currentUserId,
        lastUserId,
      };
    } catch (error) {
      console.error('[RevenueCatService] Error in checkUserSwitch:', error);
      return {
        switched: false,
        currentUserId: null,
        lastUserId: null,
      };
    }
  }

  public async clearSubscriptionData(): Promise<void> {
    console.log('[RevenueCatService] clearSubscriptionData - Clearing local cached subscription & user data');
    try {
      StorageService.delete('last_logged_in_user_id');
    } catch (error) {
      console.error('[RevenueCatService] Error in clearSubscriptionData:', error);
    }
  }

  public async syncRevenueCatUser(): Promise<{
    customerInfo: CustomerInfo | null;
    switched: boolean;
  }> {
    try {
      const { switched, currentUserId, lastUserId } = await this.checkUserSwitch();

      if (switched) {
        console.log(`[RevenueCatService] User switch detected from ${lastUserId} to ${currentUserId}. Synchronizing live RevenueCat SDK...`);
        
        // 1. Clear locally cached subscription data
        await this.clearSubscriptionData();

        // 2. Call Purchases.logOut() to clear current active user session
        await this.logOut();

        if (currentUserId) {
          // 3. Log in with the new Supabase user ID
          await this.login(currentUserId);

          // 4. Save new user ID to StorageService (MMKV)
          StorageService.setString('last_logged_in_user_id', currentUserId);

          // 5. Fetch latest Customer Info
          const latestInfo = await this.getCustomerInfo();
          
          console.log(`[RevenueCatService] Live user switch sync complete. Logged in as: ${currentUserId}`);
          return { customerInfo: latestInfo, switched: true };
        } else {
          console.log('[RevenueCatService] User has logged out. Live RevenueCat session cleared.');
          return { customerInfo: null, switched: true };
        }
      }

      console.log('[RevenueCatService] No user switch detected. Live RevenueCat session active.');
      return { customerInfo: null, switched: false };
    } catch (error) {
      console.error('[RevenueCatService] Error during syncRevenueCatUser:', error);
      throw error;
    }
  }

  private ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('RevenueCat Service is not initialized. Call initialize() first.');
    }
  }
}

export const RevenueCatService = RevenueCatServiceImpl.getInstance();
