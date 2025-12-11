export type Step = 'amount' | 'custom' | 'confirm' | 'sending' | 'success' | 'no-wallet';

export interface ZapSheetProps {
  recipientLightningAddress: string;
  recipientName: string;
  recipientUsername?: string;
  recipientAvatar?: string;
  children?: React.ReactNode;
  quickAmounts?: number[];
  onSuccess?: (amountSats: number) => void;
  onError?: (error: Error) => void;
  currentUsername?: string;
}

export interface LnurlPayRequestDetails {
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadataStr: string;
  commentAllowed: number;
  domain: string;
  url: string;
  address?: string;
  allowsNostr?: boolean;
  nostrPubkey?: string;
}

export interface RecipientInfo {
  name: string;
  username?: string;
  avatar?: string;
  lightningAddress: string;
}
