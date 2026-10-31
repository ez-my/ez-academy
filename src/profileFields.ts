// Profile fields collected at registration and editable later, plus the rules for
// the share-to-earn reward. Pure: no I/O, no Firebase. The server imports this so
// the same limits that the UI shows are the ones actually enforced.

/** Where a learner first heard about EZ Academy. Stored as an id, never free text. */
export const REFERRAL_SOURCES = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'threads', label: 'Threads' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'teacher', label: 'My teacher' },
  { id: 'friend', label: 'A friend or family' },
  { id: 'search', label: 'Google search' },
  { id: 'other', label: 'Somewhere else' },
] as const;

export type ReferralSourceId = typeof REFERRAL_SOURCES[number]['id'];

export const REFERRAL_SOURCE_IDS = REFERRAL_SOURCES.map(source => source.id) as readonly string[];

export const isReferralSource = (value: unknown): value is ReferralSourceId =>
  typeof value === 'string' && REFERRAL_SOURCE_IDS.includes(value);

export const referralSourceLabel = (id: unknown): string =>
  REFERRAL_SOURCES.find(source => source.id === id)?.label ?? 'Not answered';

export const MAX_NAME_LENGTH = 60;
export const MAX_SCHOOL_LENGTH = 120;
export const MAX_REFERRAL_NOTE_LENGTH = 80;

/** Collapse whitespace and trim. Names and schools are displayed next to each other
 *  on the leaderboard, so a name padded with spaces must not be able to shove the
 *  school out of its column. */
export const tidyText = (value: unknown, limit: number): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, limit) : '';

export interface ProfileDetails {
  displayName: string;
  school: string;
  referralSource: ReferralSourceId | '';
  referralNote: string;
  leaderboardOptOut: boolean;
}

export const EMPTY_DETAILS: ProfileDetails = {
  displayName: '',
  school: '',
  referralSource: '',
  referralNote: '',
  leaderboardOptOut: false,
};

/**
 * Normalise what the forms collect into exactly the fields that may be written.
 * Anything not named here is dropped rather than passed through, so a caller
 * cannot smuggle `plan` or `credits` in alongside a school name.
 */
export function normaliseDetails(input: Partial<ProfileDetails>): ProfileDetails {
  const referralSource = isReferralSource(input.referralSource) ? input.referralSource : '';
  return {
    displayName: tidyText(input.displayName, MAX_NAME_LENGTH),
    school: tidyText(input.school, MAX_SCHOOL_LENGTH),
    referralSource,
    // A note only means anything against "Somewhere else".
    referralNote: referralSource === 'other' ? tidyText(input.referralNote, MAX_REFERRAL_NOTE_LENGTH) : '',
    leaderboardOptOut: input.leaderboardOptOut === true,
  };
}

/** Problems to show the learner. Empty means the details are safe to save. */
export function validateDetails(details: ProfileDetails, { requireAll = false } = {}): string[] {
  const problems: string[] = [];
  if (!details.displayName) problems.push('Please enter your name.');
  else if (details.displayName.length < 2) problems.push('Your name is too short.');
  if (requireAll && !details.school) problems.push('Please enter your school.');
  if (requireAll && !details.referralSource) problems.push('Please tell us where you heard about us.');
  return problems;
}

// --- Share to earn ----------------------------------------------------------
//
// A learner who shares a finished exercise gets one extra practice. We cannot
// verify that a share really happened -- no social platform reports that back to
// the page, and navigator.share resolves even if the sheet is dismissed into a
// note to self. So this is taken on trust and bounded instead: one per day, and
// seven in the lifetime of an account. Those two caps are the whole defence, and
// they are enforced on the server, never here.

export const SHARE_REWARD_PER_DAY = 1;
export const SHARE_REWARD_MAX_PER_ACCOUNT = 7;

export const SHARE_PLATFORMS = ['tiktok', 'instagram', 'threads', 'facebook', 'whatsapp', 'other'] as const;
export type SharePlatform = typeof SHARE_PLATFORMS[number];
export const isSharePlatform = (value: unknown): value is SharePlatform =>
  typeof value === 'string' && (SHARE_PLATFORMS as readonly string[]).includes(value);

export interface ShareRewardState {
  /** How many rewards this account has ever claimed. */
  total: number;
  /** Malaysia practice day of the most recent claim, 'YYYY-MM-DD'. */
  lastDay: string;
}

export const EMPTY_SHARE_STATE: ShareRewardState = { total: 0, lastDay: '' };

export function readShareState(data: unknown): ShareRewardState {
  const raw = (data ?? {}) as Record<string, unknown>;
  const total = Number(raw.total);
  return {
    total: Number.isFinite(total) && total > 0 ? Math.floor(total) : 0,
    lastDay: typeof raw.lastDay === 'string' ? raw.lastDay : '',
  };
}

export interface ShareRewardDecision {
  granted: boolean;
  /** Why it was refused, or the confirmation to show. */
  message: string;
  next: ShareRewardState;
  remaining: number;
}

/**
 * Decide a single claim. `day` is the Malaysia practice day, the same one the
 * daily practice allowance rolls over on, so a learner's share day and their
 * practice day can never drift apart.
 */
export function claimShareReward(state: ShareRewardState, day: string): ShareRewardDecision {
  const remainingBefore = Math.max(0, SHARE_REWARD_MAX_PER_ACCOUNT - state.total);

  if (state.total >= SHARE_REWARD_MAX_PER_ACCOUNT) {
    return {
      granted: false,
      message: `You have claimed all ${SHARE_REWARD_MAX_PER_ACCOUNT} share rewards for this account.`,
      next: state,
      remaining: 0,
    };
  }
  if (state.lastDay === day) {
    return {
      granted: false,
      message: 'You have already claimed your share reward today. Come back tomorrow.',
      next: state,
      remaining: remainingBefore,
    };
  }

  const next: ShareRewardState = { total: state.total + 1, lastDay: day };
  const remaining = SHARE_REWARD_MAX_PER_ACCOUNT - next.total;
  return {
    granted: true,
    message: remaining > 0
      ? `One extra practice added. ${remaining} share ${remaining === 1 ? 'reward' : 'rewards'} left on this account.`
      : 'One extra practice added. That was the last share reward for this account.',
    next,
    remaining,
  };
}

/** What the share card should say before a learner taps it. */
export function shareAvailability(state: ShareRewardState, day: string) {
  const remaining = Math.max(0, SHARE_REWARD_MAX_PER_ACCOUNT - state.total);
  if (remaining === 0) return { canClaim: false, remaining, reason: 'all-used' as const };
  if (state.lastDay === day) return { canClaim: false, remaining, reason: 'claimed-today' as const };
  return { canClaim: true, remaining, reason: 'available' as const };
}
