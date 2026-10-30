import authorization from './trialPaperAuthorization.json';
import {TRIAL_READING_TESTS} from '../data/trialReadingTests';
import {TRIAL_LISTENING_TESTS} from '../data/trialListeningTests';

// Authorization is the user's attestation, not independently reviewed legal evidence.
// Pin the current source IDs, not just a state/year prefix or the live catalogue.
// New sets and replacement question/key/audio IDs require a separate authorization.
export const TRIAL_RIGHTS_MESSAGE = 'This trial asset is unavailable pending authorization. Original files and confidentiality labels have been preserved.';
export type TrialPaperKind = 'reading' | 'listening';
export type TrialRightsCheck = (testId: string, kind?: TrialPaperKind) => boolean;
type AssetFamily = {id:string; questionFileId:string; answerFileId?:string|null; audioFileId?:string};
export function isAuthorizedTrialAsset(asset: AssetFamily, kind: TrialPaperKind): boolean {
  return authorization[kind].some((approved:AssetFamily) =>
    approved.id === asset.id && approved.questionFileId === asset.questionFileId &&
    approved.answerFileId === asset.answerFileId && approved.audioFileId === asset.audioFileId);
}
export const mayDisplayTrialPaper: TrialRightsCheck = (testId, kind) => {
  if (typeof testId !== 'string') return false;
  const allowed = (family:TrialPaperKind) => {
    const catalog:readonly AssetFamily[] = family === 'reading' ? TRIAL_READING_TESTS : TRIAL_LISTENING_TESTS;
    const asset = catalog.find(test => test.id === testId);
    return !!asset && isAuthorizedTrialAsset(asset, family);
  };
  return kind ? allowed(kind) : allowed('reading') || allowed('listening');
};
