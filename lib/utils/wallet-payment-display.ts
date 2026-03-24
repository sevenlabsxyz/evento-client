import { Payment } from '@breeztech/breez-sdk-spark/web';

export interface WalletPaymentDisplayData {
  primaryText: string;
  secondaryText: string | null;
  description: string | null;
  senderComment: string | null;
  lightningAddress: string | null;
  lightningUsername: string | null;
  lightningDomain: string | null;
}

function normalizeText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getLightningFallback(payment: Payment): string {
  return payment.paymentType === 'receive' ? 'Lightning payment received' : 'Lightning payment';
}

export function getWalletPaymentDisplayData(payment: Payment): WalletPaymentDisplayData {
  if (!payment.details) {
    return {
      primaryText: 'No description',
      secondaryText: null,
      description: null,
      senderComment: null,
      lightningAddress: null,
      lightningUsername: null,
      lightningDomain: null,
    };
  }

  switch (payment.details.type) {
    case 'lightning': {
      const description = normalizeText(payment.details.description);
      const senderComment =
        normalizeText(payment.details.lnurlReceiveMetadata?.senderComment) ??
        normalizeText(payment.details.lnurlPayInfo?.comment);
      const lightningAddress = normalizeText(payment.details.lnurlPayInfo?.lnAddress);
      const [usernameFromAddress, domainFromAddress] = lightningAddress?.split('@') ?? [];
      const lightningUsername = normalizeText(usernameFromAddress);
      const lightningDomain =
        normalizeText(payment.details.lnurlPayInfo?.domain) ?? normalizeText(domainFromAddress);
      const primaryText = senderComment ?? description ?? getLightningFallback(payment);
      const secondaryText =
        senderComment && description && senderComment !== description ? description : null;

      return {
        primaryText,
        secondaryText,
        description,
        senderComment,
        lightningAddress,
        lightningUsername,
        lightningDomain,
      };
    }
    case 'spark':
      return {
        primaryText: 'Spark payment',
        secondaryText: null,
        description: null,
        senderComment: null,
        lightningAddress: null,
        lightningUsername: null,
        lightningDomain: null,
      };
    case 'token':
      return {
        primaryText: 'Token payment',
        secondaryText: null,
        description: null,
        senderComment: null,
        lightningAddress: null,
        lightningUsername: null,
        lightningDomain: null,
      };
    case 'withdraw':
      return {
        primaryText: 'Withdrawal',
        secondaryText: null,
        description: null,
        senderComment: null,
        lightningAddress: null,
        lightningUsername: null,
        lightningDomain: null,
      };
    case 'deposit':
      return {
        primaryText: 'Deposit',
        secondaryText: null,
        description: null,
        senderComment: null,
        lightningAddress: null,
        lightningUsername: null,
        lightningDomain: null,
      };
    default:
      return {
        primaryText: 'Payment',
        secondaryText: null,
        description: null,
        senderComment: null,
        lightningAddress: null,
        lightningUsername: null,
        lightningDomain: null,
      };
  }
}
