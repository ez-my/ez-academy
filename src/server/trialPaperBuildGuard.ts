import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import authorization from '../lib/trialPaperAuthorization.json';
import {isAuthorizedTrialAsset} from '../lib/trialPaperRights';
import {TRIAL_READING_TESTS} from '../data/trialReadingTests';
import {TRIAL_LISTENING_TESTS} from '../data/trialListeningTests';

// The readable banks/keys are shared modules. Reject catalogue/source drift
// before Vite can publish them, rather than relying only on a hidden UI.
export function assertTrialPaperBuildAuthorized(read:(file:string)=>Buffer = readFileSync) {
 for(const [kind,catalog] of [['reading',TRIAL_READING_TESTS],['listening',TRIAL_LISTENING_TESTS]] as const){
  for(const asset of catalog)if(!isAuthorizedTrialAsset(asset,kind))throw Error(`Unauthorized ${kind} asset: ${asset.id}`);
 }
 for(const original of authorization.fingerprints){
  if(createHash('sha256').update(read(original.file)).digest('hex')!==original.sha256)throw Error(`Original trial asset changed: ${original.file}`);
 }
}
