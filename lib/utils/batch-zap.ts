import { EventRSVP } from '@/lib/types/api';

export const MIN_BATCH_ZAP_PER_PERSON_SATS = 5;

export type BatchZapAmountMode = 'per-person' | 'total-split';
export type BatchZapResultStatus = 'sent' | 'failed' | 'skipped';

export interface BatchZapRecipient {
  userId: string;
  name: string;
  username?: string;
  avatar?: string;
  lightningAddress: string;
}

export interface BatchZapResult {
  recipient: BatchZapRecipient;
  amountSats: number;
  status: BatchZapResultStatus;
  error?: string;
}

export interface BatchZapProgress {
  status: 'idle' | 'sending' | 'completed';
  currentIndex: number;
  totalCount: number;
  currentRecipient: BatchZapRecipient | null;
  sentCount: number;
  failedCount: number;
  remainingCount: number;
  results: BatchZapResult[];
}

export interface BatchZapRecipientSummary {
  eligibleRecipients: BatchZapRecipient[];
  excludedSelf: EventRSVP[];
  excludedHosts: EventRSVP[];
  excludedNoLightning: EventRSVP[];
  isViewerHost: boolean;
}

export interface BatchZapDistribution {
  amountMode: BatchZapAmountMode;
  enteredAmountSats: number;
  recipientCount: number;
  perRecipientAmountSats: number;
  totalAmountSats: number;
  leftoverSats: number;
}

interface BuildBatchZapRecipientsParams {
  rsvps: EventRSVP[];
  creatorUserId?: string | null;
  hostUserIds?: string[];
  currentUserId?: string;
  isViewerHost: boolean;
}

interface ValidateBatchZapParams {
  amountMode: BatchZapAmountMode | null;
  enteredAmountSats: number;
  recipientCount: number;
}

const hasUsableLightningAddress = (value?: string | null) => {
  if (!value) return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  const [localPart, domainPart] = trimmed.split('@');
  return Boolean(localPart && domainPart);
};

const toBatchZapRecipient = (rsvp: EventRSVP): BatchZapRecipient => ({
  userId: rsvp.user_id,
  name: rsvp.user_details?.name || rsvp.user_details?.username || 'Guest',
  username: rsvp.user_details?.username || undefined,
  avatar: rsvp.user_details?.image || undefined,
  lightningAddress: rsvp.user_details?.ln_address?.trim() || '',
});

export function buildBatchZapRecipients({
  rsvps,
  creatorUserId,
  hostUserIds = [],
  currentUserId,
  isViewerHost,
}: BuildBatchZapRecipientsParams): BatchZapRecipientSummary {
  const hostIds = new Set<string>([creatorUserId, ...hostUserIds].filter(Boolean) as string[]);
  const excludedSelf: EventRSVP[] = [];
  const excludedHosts: EventRSVP[] = [];
  const excludedNoLightning: EventRSVP[] = [];
  const eligibleRecipients: BatchZapRecipient[] = [];
  const seenUserIds = new Set<string>();

  for (const rsvp of rsvps) {
    if (!rsvp.user_id || seenUserIds.has(rsvp.user_id)) {
      continue;
    }

    seenUserIds.add(rsvp.user_id);

    if (currentUserId && rsvp.user_id === currentUserId) {
      excludedSelf.push(rsvp);
      continue;
    }

    if (isViewerHost && hostIds.has(rsvp.user_id)) {
      excludedHosts.push(rsvp);
      continue;
    }

    if (!hasUsableLightningAddress(rsvp.user_details?.ln_address)) {
      excludedNoLightning.push(rsvp);
      continue;
    }

    eligibleRecipients.push(toBatchZapRecipient(rsvp));
  }

  return {
    eligibleRecipients,
    excludedSelf,
    excludedHosts,
    excludedNoLightning,
    isViewerHost,
  };
}

export function getBatchZapDistribution(
  amountMode: BatchZapAmountMode,
  enteredAmountSats: number,
  recipientCount: number
): BatchZapDistribution | null {
  if (enteredAmountSats <= 0 || recipientCount <= 0) {
    return null;
  }

  if (amountMode === 'per-person') {
    return {
      amountMode,
      enteredAmountSats,
      recipientCount,
      perRecipientAmountSats: enteredAmountSats,
      totalAmountSats: enteredAmountSats * recipientCount,
      leftoverSats: 0,
    };
  }

  const perRecipientAmountSats = Math.floor(enteredAmountSats / recipientCount);
  const totalAmountSats = perRecipientAmountSats * recipientCount;

  return {
    amountMode,
    enteredAmountSats,
    recipientCount,
    perRecipientAmountSats,
    totalAmountSats,
    leftoverSats: enteredAmountSats - totalAmountSats,
  };
}

export function validateBatchZap({
  amountMode,
  enteredAmountSats,
  recipientCount,
}: ValidateBatchZapParams): {
  valid: boolean;
  error?: string;
  distribution: BatchZapDistribution | null;
} {
  if (!recipientCount) {
    return {
      valid: false,
      error: 'There are no guests eligible to receive this batch zap.',
      distribution: null,
    };
  }

  if (!amountMode) {
    return {
      valid: false,
      error: 'Choose whether the amount is per person or split across the total.',
      distribution: null,
    };
  }

  if (!Number.isInteger(enteredAmountSats) || enteredAmountSats <= 0) {
    return {
      valid: false,
      error: 'Enter a whole number of sats greater than zero.',
      distribution: null,
    };
  }

  const distribution = getBatchZapDistribution(amountMode, enteredAmountSats, recipientCount);

  if (!distribution) {
    return {
      valid: false,
      error: 'Enter a valid amount to continue.',
      distribution: null,
    };
  }

  if (distribution.perRecipientAmountSats < MIN_BATCH_ZAP_PER_PERSON_SATS) {
    const error =
      amountMode === 'per-person'
        ? `Each guest must receive at least ${MIN_BATCH_ZAP_PER_PERSON_SATS} sats.`
        : `This total splits to less than ${MIN_BATCH_ZAP_PER_PERSON_SATS} sats per guest.`;

    return {
      valid: false,
      error,
      distribution,
    };
  }

  return {
    valid: true,
    distribution,
  };
}
