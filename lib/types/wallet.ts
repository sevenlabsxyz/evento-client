export interface WalletState {
  isInitialized: boolean;
  isConnected: boolean;
  balance: number; // in sats
  hasBackup: boolean;
  lastBackupDate?: Date;
  lightningAddress?: string;
}

export interface WalletSetupData {
  mnemonic: string;
  password: string;
  hasCloudBackup: boolean;
}

export interface PaymentRequest {
  amount: number; // in sats
  description: string;
  recipient?: string; // Lightning address or invoice
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number; // in sats
  fee: number; // in sats
  description?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
}

export interface InvoiceData {
  bolt11: string;
  paymentRequest: string;
  amount: number; // in sats
  description: string;
  expiresAt: Date;
  qrCode?: string;
}

export interface ZapRequest {
  recipientId: string;
  recipientUsername: string;
  amount: number; // in sats
  message?: string;
}

export interface BTCPrice {
  usd: number;
  lastUpdated: Date;
}

export interface FeeEstimate {
  lightning: number; // in sats
  sparkTransfer?: number; // in sats
}

export interface WalletConfig {
  network: 'mainnet' | 'testnet';
  apiKey: string;
  storageDir: string;
}

export interface BackupOptions {
  provider: 'icloud' | 'google' | 'manual';
  encryptedSeed: string;
  timestamp: Date;
}
