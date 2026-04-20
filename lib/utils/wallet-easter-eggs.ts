import { Payment } from '@breeztech/breez-sdk-spark/web';

export interface WalletEasterEggRule {
  id: string;
  senderCommentExact?: string;
  senderCommentIncludesAny?: readonly string[];
}

export interface WalletEasterEggMatch {
  id: string;
  senderComment: string;
}

const WALLET_EASTER_EGG_RULES: readonly WalletEasterEggRule[] = [
  {
    id: 'medal-podium',
    senderCommentIncludesAny: ['🥇', '🥈', '🥉'],
  },
];

function normalizeSenderComment(senderComment?: string | null): string | null {
  if (typeof senderComment !== 'string') {
    return null;
  }

  const trimmed = senderComment.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getWalletEasterEggSenderComment(payment: Payment): string | null {
  if (payment.details?.type !== 'lightning') {
    return null;
  }

  return normalizeSenderComment(payment.details.lnurlReceiveMetadata?.senderComment);
}

export function findMatchingWalletEasterEgg(
  senderComment: string | null | undefined,
  rules: readonly WalletEasterEggRule[] = WALLET_EASTER_EGG_RULES
): WalletEasterEggMatch | null {
  const normalizedSenderComment = normalizeSenderComment(senderComment);

  if (!normalizedSenderComment) {
    return null;
  }

  const match = rules.find((rule) => {
    if (rule.senderCommentExact === normalizedSenderComment) {
      return true;
    }

    if (rule.senderCommentIncludesAny?.some((token) => normalizedSenderComment.includes(token))) {
      return true;
    }

    return false;
  });

  if (!match) {
    return null;
  }

  return {
    id: match.id,
    senderComment: normalizedSenderComment,
  };
}

export function matchWalletEasterEgg(
  payment: Payment,
  rules: readonly WalletEasterEggRule[] = WALLET_EASTER_EGG_RULES
): WalletEasterEggMatch | null {
  const senderComment = getWalletEasterEggSenderComment(payment);
  return findMatchingWalletEasterEgg(senderComment, rules);
}
