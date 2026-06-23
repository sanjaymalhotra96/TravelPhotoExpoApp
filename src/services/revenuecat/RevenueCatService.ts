import Purchases, { CustomerInfo, PurchasesOffering, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { IRevenueCatAdapter } from '@/services/revenuecat/RevenueCatAdapter';
import { REVENUECAT_CONSTANTS } from '@/services/revenuecat/revenuecat.constants';
import { supabase } from '@/lib/supabase';
import { StorageService } from '@/services/storage';

const isPlaceholderKey = (key?: string): boolean => {
  return !key || key === '' || key.includes('YOUR_') || key.includes('_KEY_HERE');
};

class RevenueCatServiceImpl implements IRevenueCatAdapter {
  private static instance: RevenueCatServiceImpl;
  private isInitialized = false;
  private isMockMode = false;

  private constructor() {}

  public static getInstance(): RevenueCatServiceImpl {
    if (!RevenueCatServiceImpl.instance) {
      RevenueCatServiceImpl.instance = new RevenueCatServiceImpl();
    }
    return RevenueCatServiceImpl.instance;
  }

  public async initialize(appUserID?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('[RevenueCatService] initialize: Already initialized.');
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

    if (isPlaceholderKey(apiKey)) {
      console.warn(`[RevenueCatService] Running in MOCK/DEMO mode because API keys are not configured or are placeholders (Key: ${maskedKey}).`);
      this.isMockMode = true;
      this.isInitialized = true;
      return;
    }

    console.log(`[RevenueCatService] Initializing real SDK on Platform: ${Platform.OS} with API key: ${maskedKey}`);

    try {
      if (__DEV__) {
        console.log('[RevenueCatService] Enabling verbose debug logs in RevenueCat SDK.');
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }
      
      if (appUserID) {
        console.log(`[RevenueCatService] Configuring Purchases SDK with appUserID: ${appUserID}`);
        await Purchases.configure({ apiKey: apiKey!, appUserID });
      } else {
        console.log('[RevenueCatService] Configuring Purchases SDK with anonymous user.');
        await Purchases.configure({ apiKey: apiKey! });
      }
      this.isInitialized = true;
      console.log('[RevenueCatService] Native SDK initialization complete.');
    } catch (err: any) {
      console.error('[RevenueCatService] Failed to configure native SDK:', err);
      console.error('  - Error Message:', err?.message);
      console.error('  - Underlying Error Message:', err?.underlyingErrorMessage);
      console.warn('[RevenueCatService] Falling back to MOCK/DEMO mode.');
      this.isMockMode = true;
      this.isInitialized = true;
    }
  }

  public async getCustomerInfo(): Promise<CustomerInfo> {
    if (this.isMockMode) {
      console.log('[RevenueCatService] getCustomerInfo: Mock mode. Returning mock customer info.');
      return {
        entitlements: {
          all: {},
          active: {},
        },
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: [],
        latestExpirationDate: null,
        firstSeen: new Date().toISOString(),
        originalAppUserId: 'mock-user',
        requestDate: new Date().toISOString(),
        originalPurchaseDate: null,
        originalApplicationVersion: null,
        managementURL: null,
        nonSubscriptionTransactions: [],
      } as any;
    }
    this.ensureInitialized();
    console.log('[RevenueCatService] getCustomerInfo: Fetching current customer info from SDK...');
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('[RevenueCatService] getCustomerInfo: Customer info retrieved. Active entitlements:', JSON.stringify(customerInfo.entitlements.active, null, 2));
      return customerInfo;
    } catch (error: any) {
      console.error('[RevenueCatService] error in getCustomerInfo:');
      console.error('  - Error Message:', error?.message);
      console.error('  - Error Code:', error?.code);
      console.error('  - Underlying Error Message:', error?.underlyingErrorMessage);
      throw error;
    }
  }

  public async getOfferings(): Promise<PurchasesOffering[]> {
    if (this.isMockMode) {
      console.log('[RevenueCatService] getOfferings: Running in Mock Mode. Returning mock offerings.');
      const mockPackages = [
        {
          identifier: '$rc_monthly',
          packageType: 'MONTHLY',
          product: {
            identifier: 'monthly_subscription',
            description: 'Unlimited access to all AI travel portraits, billed monthly.',
            title: 'Premium Monthly',
            price: 4.99,
            priceString: '$4.99',
            currencyCode: 'USD',
          },
        },
      ];

      return [
        {
          identifier: 'premium_offering',
          serverDescription: 'Premium plans offering unlimited generations',
          availablePackages: mockPackages,
          monthly: mockPackages[0],
          yearly: null,
          lifetime: null,
        } as any,
      ];
    }
    this.ensureInitialized();
    console.log('[RevenueCatService] getOfferings: Requesting offerings from RevenueCat...');
    try {
      const offerings = await Purchases.getOfferings();
      console.log('[RevenueCatService] getOfferings: Raw offerings response:', JSON.stringify(offerings, null, 2));

      if (!offerings) {
        console.warn('[RevenueCatService] getOfferings: Offerings response is null or undefined.');
        return [];
      }

      const result: PurchasesOffering[] = [];
      if (offerings.current) {
        console.log(`[RevenueCatService] getOfferings: Found active current offering: ${offerings.current.identifier}`);
        result.push(offerings.current);
      } else {
        console.warn('[RevenueCatService] getOfferings: offerings.current is null. No default offering is set in the RevenueCat dashboard.');
      }

      if (offerings.all && Object.keys(offerings.all).length > 0) {
        console.log(`[RevenueCatService] getOfferings: Found all offerings keys: ${Object.keys(offerings.all).join(', ')}`);
        if (!offerings.current) {
          const firstOfferingKey = Object.keys(offerings.all)[0];
          const fallbackOffering = offerings.all[firstOfferingKey];
          if (fallbackOffering) {
            console.log(`[RevenueCatService] getOfferings: Falling back to first available offering: ${firstOfferingKey}`);
            result.push(fallbackOffering);
          }
        }
      } else {
        console.warn('[RevenueCatService] getOfferings: offerings.all is empty. There are no offerings configured or published on the RevenueCat dashboard.');
      }

      if (result.length === 0) {
        console.warn(
          '[RevenueCatService] getOfferings: No offerings returned to provider. ' +
          'Please verify in the RevenueCat Dashboard:\n' +
          '1. You have configured an Offering and linked Packages to it.\n' +
          '2. Those Packages contain valid Products (like "monthly:monthly").\n' +
          '3. Under Google Play Console, the corresponding Subscriptions are active.\n' +
          '4. The Service Account credentials uploaded to RevenueCat are correct and have appropriate permissions.\n' +
          '5. The product status is not stuck on "Could not check" due to configuration/billing setup errors.'
        );
      } else {
        result.forEach(offering => {
          console.log(`[RevenueCatService] Offering: ${offering.identifier}, Description: ${offering.serverDescription}`);
          if (offering.availablePackages && offering.availablePackages.length > 0) {
            offering.availablePackages.forEach((pkg, index) => {
              console.log(
                `  - Package [${index}]: Identifier: ${pkg.identifier}, type: ${pkg.packageType}, ` +
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
      console.error('[RevenueCatService] error fetching offerings from RevenueCat SDK:');
      console.error('  - Error Message:', error?.message);
      console.error('  - Error Code:', error?.code);
      console.error('  - Underlying Error Message:', error?.underlyingErrorMessage);
      console.error('  - User Cancelled:', error?.userCancelled);
      console.error('  - Full Error Object:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  public async purchasePackage(packageToBuy: any): Promise<CustomerInfo> {
    if (this.isMockMode) {
      console.log('[RevenueCatService] purchasePackage: Mock purchasing package:', packageToBuy.identifier);
      return {
        entitlements: {
          all: {
            [REVENUECAT_CONSTANTS.ENTITLEMENT_ID]: {
              identifier: REVENUECAT_CONSTANTS.ENTITLEMENT_ID,
              isActive: true,
              willRenew: true,
              periodType: 'NORMAL',
              latestPurchaseDate: new Date().toISOString(),
              originalPurchaseDate: new Date().toISOString(),
              expirationDate: null,
              store: 'PLAY_STORE',
              isSandbox: true,
              unsubscribeDetectedAt: null,
              billingIssueDetectedAt: null,
              productIdentifier: packageToBuy.product.identifier,
            },
          },
          active: {
            [REVENUECAT_CONSTANTS.ENTITLEMENT_ID]: {
              identifier: REVENUECAT_CONSTANTS.ENTITLEMENT_ID,
              isActive: true,
              willRenew: true,
              periodType: 'NORMAL',
              latestPurchaseDate: new Date().toISOString(),
              originalPurchaseDate: new Date().toISOString(),
              expirationDate: null,
              store: 'PLAY_STORE',
              isSandbox: true,
              unsubscribeDetectedAt: null,
              billingIssueDetectedAt: null,
              productIdentifier: packageToBuy.product.identifier,
            },
          },
        },
        activeSubscriptions: [packageToBuy.product.identifier],
        allPurchasedProductIdentifiers: [packageToBuy.product.identifier],
        latestExpirationDate: null,
        firstSeen: new Date().toISOString(),
        originalAppUserId: 'mock-user',
        requestDate: new Date().toISOString(),
        originalPurchaseDate: null,
        originalApplicationVersion: null,
        managementURL: null,
        nonSubscriptionTransactions: [],
      } as any;
    }
    this.ensureInitialized();
    console.log(`[RevenueCatService] purchasePackage: Initiating purchase for package identifier: ${packageToBuy.identifier}, Product ID: ${packageToBuy.product?.identifier}`);
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
      console.log('[RevenueCatService] purchasePackage: Purchase succeeded. Updated customer info entitlements:', JSON.stringify(customerInfo.entitlements, null, 2));
      return customerInfo;
    } catch (error: any) {
      console.error('[RevenueCatService] error during purchasePackage:');
      console.error('  - Error Message:', error?.message);
      console.error('  - Error Code:', error?.code);
      console.error('  - Underlying Error Message:', error?.underlyingErrorMessage);
      console.error('  - User Cancelled:', error?.userCancelled);
      console.error('  - Full Error Object:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  public async restorePurchases(): Promise<CustomerInfo> {
    if (this.isMockMode) {
      console.log('[RevenueCatService] restorePurchases: Mock restoring purchases...');
      return this.purchasePackage({
        identifier: '$rc_monthly',
        product: { identifier: 'monthly_subscription' }
      });
    }
    this.ensureInitialized();
    console.log('[RevenueCatService] restorePurchases: Initiating restore purchases...');
    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('[RevenueCatService] restorePurchases: Restore succeeded. Entitlements:', JSON.stringify(customerInfo.entitlements, null, 2));
      return customerInfo;
    } catch (error: any) {
      console.error('[RevenueCatService] error during restorePurchases:');
      console.error('  - Error Message:', error?.message);
      console.error('  - Error Code:', error?.code);
      console.error('  - Underlying Error Message:', error?.underlyingErrorMessage);
      console.error('  - Full Error Object:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  public async logOut(): Promise<CustomerInfo> {
    if (this.isMockMode) {
      console.log('[RevenueCatService] logOut: Mock logging out.');
      return await this.getCustomerInfo();
    }
    this.ensureInitialized();
    console.log('[RevenueCatService] logOut: Logging out current active user...');
    try {
      const customerInfo = await Purchases.logOut();
      console.log('[RevenueCatService] logOut: Log out complete.');
      return customerInfo;
    } catch (error: any) {
      console.error('[RevenueCatService] error during logOut:', error);
      throw error;
    }
  }

  public async login(appUserID: string): Promise<{ customerInfo: CustomerInfo; created: boolean }> {
    if (this.isMockMode) {
      console.log('[RevenueCatService] login: Mock logging in user:', appUserID);
      const info = await this.getCustomerInfo();
      return { customerInfo: info, created: true };
    }
    this.ensureInitialized();
    console.log(`[RevenueCatService] login: Logging in user with ID: ${appUserID}...`);
    try {
      const result = await Purchases.logIn(appUserID);
      console.log(`[RevenueCatService] login: User logged in. Created new user: ${result.created}. Active entitlements:`, JSON.stringify(result.customerInfo.entitlements.active, null, 2));
      return result;
    } catch (error: any) {
      console.error(`[RevenueCatService] error logging in user ${appUserID}:`);
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
        console.log(`[RevenueCatService] User switch detected from ${lastUserId} to ${currentUserId}. Synchronizing RevenueCat...`);
        
        // 1. Clear locally cached subscription data
        await this.clearSubscriptionData();

        // 2. Call Purchases.logOut() to clear current active user session
        await this.logOut();

        if (currentUserId) {
          // 3. Log in with the new Supabase user ID
          const { customerInfo } = await this.login(currentUserId);

          // 4. Save new user ID to StorageService (MMKV)
          StorageService.setString('last_logged_in_user_id', currentUserId);

          // 5. Fetch latest Customer Info
          const latestInfo = await this.getCustomerInfo();
          
          console.log(`[RevenueCatService] User switch sync complete. Logged in as: ${currentUserId}`);
          return { customerInfo: latestInfo, switched: true };
        } else {
          console.log('[RevenueCatService] User has logged out. RevenueCat session cleared.');
          return { customerInfo: null, switched: true };
        }
      }

      console.log('[RevenueCatService] No user switch detected. Subscription state remains active.');
      return { customerInfo: null, switched: false };
    } catch (error) {
      console.error('[RevenueCatService] Error during syncRevenueCatUser:', error);
      throw error;
    }
  }

  public getIsMockMode(): boolean {
    return this.isMockMode;
  }

  private ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('RevenueCat Service is not initialized. Call initialize() first.');
    }
  }
}

export const RevenueCatService = RevenueCatServiceImpl.getInstance();
