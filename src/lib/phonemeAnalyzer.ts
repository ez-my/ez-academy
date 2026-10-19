export interface PronunciationIssue {
  pattern: string;
  issue: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

export function analyzePhonemesAndPatterns(transcript: string): PronunciationIssue[] {
  const issues: PronunciationIssue[] = [];
  const lowerTranscript = transcript.toLowerCase();
  
  // 1. Th-Stopping (θ -> t, ð -> d)
  if (/\b(dat|dis|dere|den|de)\b/i.test(lowerTranscript)) {
    issues.push({
      pattern: 'dat / dis / dere',
      issue: 'Th-Stopping: Pronouncing "th" as "d" (e.g., "that" as "dat").',
      suggestion: 'Place your tongue between your teeth and push air out to make the voiced /ð/ sound.',
      severity: 'high'
    });
  }
  
  if (/\b(tink|tought|ting|tanks)\b/i.test(lowerTranscript)) {
    issues.push({
      pattern: 'tink / ting / tanks',
      issue: 'Th-Stopping: Pronouncing "th" as "t" (e.g., "think" as "tink").',
      suggestion: 'Use the voiceless /θ/ sound for words like "think" and "thing". Don\'t block the airflow.',
      severity: 'high'
    });
  }

  // 2. Final Consonant Deletion
  if (/\b(accep|firs|nex|trus|fas)\b/i.test(lowerTranscript)) {
    issues.push({
      pattern: 'Missing final consonants',
      issue: 'Final consonant cluster reduction (e.g., "next" sounds like "nex").',
      suggestion: 'Make sure to fully pronounce the final consonants, especially "t" and "d" sounds at the ends of words.',
      severity: 'medium'
    });
  }
  
  // 3. Vowel Length
  if (/\b(shit|bitch)\b/i.test(lowerTranscript) && !lowerTranscript.includes('swear')) {
    issues.push({
      pattern: 'Short/Long Vowel Confusion',
      issue: 'Confusing long /i:/ and short /ɪ/ vowels.',
      suggestion: 'Smile slightly and stretch the sound for long vowels like in "sheet".',
      severity: 'high'
    });
  }

  // 4. L/R Confusion
  if (/\b(flyed|flied)\b/i.test(lowerTranscript) && lowerTranscript.includes('rice')) {
     issues.push({
      pattern: 'L/R Confusion',
      issue: 'Swapping "r" and "l" (e.g., "fried" -> "flied").',
      suggestion: 'Practice distinguishing the alveolar lateral approximant (L) from the alveolar approximant (R).',
      severity: 'medium'
    });
  }

  // 5. Manglish Fillers
  if (/\b(lah|mah|meh|leh|lor|liao)\b/i.test(lowerTranscript)) {
    issues.push({
      pattern: 'lah / mah / leh',
      issue: 'Use of informal Manglish particles.',
      suggestion: 'Avoid these entirely in formal SPM speaking exams. Use intonation to express emotion instead.',
      severity: 'high'
    });
  }

  // 6. Plural / Past Tense dropping
  if (/one of the [a-z]+(?<!s)\b/i.test(lowerTranscript)) {
    issues.push({
      pattern: 'one of the + singular',
      issue: 'Missing plural "s" (e.g., "one of the boy").',
      suggestion: 'Always use a plural noun after "one of the". Make sure to pronounce the final "s" clearly.',
      severity: 'medium'
    });
  }

  // 7. Universal tag question
  if (/\bis it\b\?/i.test(lowerTranscript) && !lowerTranscript.includes('what is it')) {
    issues.push({
      pattern: 'is it?',
      issue: 'Overuse of "is it?" as a universal question tag.',
      suggestion: 'Match the question tag to the auxiliary verb (e.g., "They are coming, aren\'t they?").',
      severity: 'medium'
    });
  }

  // 8. Copula dropping
  if (/\b(he|she|it|they) (going|playing|doing|eating|running)\b/i.test(lowerTranscript)) {
    issues.push({
      pattern: 'Pronoun + Verb-ing',
      issue: 'Missing "to be" verb (e.g., "He going").',
      severity: 'high',
      suggestion: 'Always include the auxiliary verb ("is/are/am") before an "-ing" verb.'
    });
  }

  return issues;
}
