import { translateHooks } from '@/lib/i18n/active-translator';
import type { Payment } from '@breeztech/breez-sdk-spark/ssr';

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
  return payment.paymentType === 'receive'
    ? translateHooks('wallet.paymentDisplay.lightningReceived')
    : translateHooks('wallet.paymentDisplay.lightning');
}

function getDefaultDescription(payment: Payment): string {
  if (!payment.details) {
    return translateHooks('wallet.paymentDisplay.noDescription');
  }

  switch (payment.details.type) {
    case 'lightning':
      return getLightningFallback(payment);
    case 'spark':
      return translateHooks('wallet.paymentDisplay.spark');
    case 'token':
      return translateHooks('wallet.paymentDisplay.token');
    case 'withdraw':
      return translateHooks('wallet.paymentDisplay.withdrawal');
    case 'deposit':
      return translateHooks('wallet.paymentDisplay.deposit');
    default:
      return translateHooks('wallet.paymentDisplay.payment');
  }
}

function getLegacyLightningAddress(payment: Payment): string | null {
  if (payment.details?.type !== 'lightning') {
    return null;
  }

  const details = payment.details as Payment['details'] & {
    lightningAddress?: string | null;
    lnAddress?: string | null;
    destinationAddress?: string | null;
  };

  return (
    normalizeText(details.lightningAddress) ??
    normalizeText(details.lnAddress) ??
    normalizeText(details.destinationAddress)
  );
}

function getLnurlWithdrawDomain(payment: Payment): string | null {
  if (payment.details?.type !== 'lightning') {
    return null;
  }

  const withdrawUrl = normalizeText(payment.details.lnurlWithdrawInfo?.withdrawUrl);

  if (!withdrawUrl) {
    return null;
  }

  try {
    return normalizeText(new URL(withdrawUrl).hostname);
  } catch {
    return null;
  }
}

export function getWalletPaymentDisplayData(payment: Payment): WalletPaymentDisplayData {
  if (!payment.details) {
    return {
      primaryText: translateHooks('wallet.paymentDisplay.noDescription'),
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
      const lightningAddress =
        normalizeText(payment.details.lnurlPayInfo?.lnAddress) ??
        getLegacyLightningAddress(payment);
      const [usernameFromAddress, domainFromAddress] = lightningAddress?.split('@') ?? [];
      const lightningUsername = normalizeText(usernameFromAddress);
      const lightningDomain =
        normalizeText(payment.details.lnurlPayInfo?.domain) ??
        normalizeText(domainFromAddress) ??
        getLnurlWithdrawDomain(payment);
      const primaryText = senderComment ?? description ?? getDefaultDescription(payment);
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
        primaryText: translateHooks('wallet.paymentDisplay.spark'),
        secondaryText: null,
        description: translateHooks('wallet.paymentDisplay.spark'),
        senderComment: null,
        lightningAddress: null,
        lightningUsername: null,
        lightningDomain: null,
      };
    case 'token':
      return {
        primaryText: translateHooks('wallet.paymentDisplay.token'),
        secondaryText: null,
        description: translateHooks('wallet.paymentDisplay.token'),
        senderComment: null,
        lightningAddress: null,
        lightningUsername: null,
        lightningDomain: null,
      };
    case 'withdraw':
      return {
        primaryText: translateHooks('wallet.paymentDisplay.withdrawal'),
        secondaryText: null,
        description: translateHooks('wallet.paymentDisplay.withdrawal'),
        senderComment: null,
        lightningAddress: null,
        lightningUsername: null,
        lightningDomain: null,
      };
    case 'deposit':
      return {
        primaryText: translateHooks('wallet.paymentDisplay.deposit'),
        secondaryText: null,
        description: translateHooks('wallet.paymentDisplay.deposit'),
        senderComment: null,
        lightningAddress: null,
        lightningUsername: null,
        lightningDomain: null,
      };
    default:
      return {
        primaryText: translateHooks('wallet.paymentDisplay.payment'),
        secondaryText: null,
        description: null,
        senderComment: null,
        lightningAddress: null,
        lightningUsername: null,
        lightningDomain: null,
      };
  }
}
