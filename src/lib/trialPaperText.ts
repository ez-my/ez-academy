// Never feed marked source text through legacy layout helpers that strip labels.
// Keep all original words/markings in the readable view, not just the Drive iframe.
export function preserveOriginalTrialText(text:string):string|null {
 return /\b(?:SULIT|TERHAD)\b/i.test(text) ? text : null;
}
