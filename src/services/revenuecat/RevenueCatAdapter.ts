import { CustomerInfo, PurchasesOffering } from 'react-native-purchases';

export interface IRevenueCatAdapter {
  initialize(appUserID?: string): Promise<void>;
  getCustomerInfo(): Promise<CustomerInfo>;
  getOfferings(): Promise<PurchasesOffering[]>;
  purchasePackage(packageToBuy: any): Promise<CustomerInfo>;
  restorePurchases(): Promise<CustomerInfo>;
  logOut(): Promise<CustomerInfo>;
  login(appUserID: string): Promise<{ customerInfo: CustomerInfo; created: boolean }>;
  getIsMockMode(): boolean;
  checkUserSwitch(): Promise<{ switched: boolean; currentUserId: string | null; lastUserId: string | null }>;
  clearSubscriptionData(): Promise<void>;
  syncRevenueCatUser(): Promise<{ customerInfo: CustomerInfo | null; switched: boolean }>;
}
