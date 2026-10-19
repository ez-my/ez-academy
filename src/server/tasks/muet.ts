import { 
  MUETTopic, 
  MUETCandidateId, 
  MUETExaminerReport, 
  MUETDiscussionTurn 
} from '../../types/muet';
import { generateJSONWithAI } from './spm';
import { getFriendlyErrorMessage } from '../retry';

function checkFeedback(result: any, transcript: string) {
  const areas=['taskFulfilment','fluencyAndCoherence','languageAndGrammar','interactionAndCommunicativeCompetence'];
  if (!result || !Number.isFinite(result.bandScoreNumber) || result.bandScoreNumber < 1 || result.bandScoreNumber > 5.5 ||
      typeof result.overallBandEstimate !== 'string' || !Array.isArray(result.strengths) || !Array.isArray(result.actionableSteps) ||
      areas.some(key => !result[key] || !Number.isFinite(result[key].score) || result[key].score < 0 || result[key].score > 5 || !Array.isArray(result[key].observations) || !Array.isArray(result[key].suggestions)))
    throw new Error('The AI feedback was incomplete. Please try again.');
  const evidence=result.transcriptEvidence;
  if (evidence) for (const key of ['strongQuote','upgradeQuote']) {
    if (typeof evidence[key] !== 'string' || !transcript.includes(evidence[key])) evidence[key]='';
  }
}

// Common English filler words that students often use when hesitating
const FILLER_WORDS = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'actually', 'basically', 'i mean', 'so yeah'];

export function detectFillers(text: string): { count: number; words: string[] } {
  if (!text) return { count: 0, words: [] };
  const lower = text.toLowerCase();
  const foundWords: string[] = [];
  let totalCount = 0;

  FILLER_WORDS.forEach(filler => {
    // Regex matching whole word/phrase
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      totalCount += matches.length;
      foundWords.push(`${filler} (${matches.length})`);
    }
  });

  return { count: totalCount, words: foundWords };
}

export function estimateSpeechPace(wordCount: number, durationSeconds: number): 'Calm & Measured' | 'Natural Flow' | 'Slightly Rushed' | 'Hesitant' {
  if (durationSeconds <= 0 || wordCount <= 0) return 'Hesitant';
  const wordsPerMinute = (wordCount / durationSeconds) * 60;
  if (wordsPerMinute < 85) return 'Hesitant';
  if (wordsPerMinute <= 135) return 'Calm & Measured';
  if (wordsPerMinute <= 165) return 'Natural Flow';
  return 'Slightly Rushed';
}

/**
 * Analyzes MUET Part 1 (Individual Presentation / Speaking on your own)
 */
export async function analyzeMUETPart1(
  topic: MUETTopic,
  candidate: MUETCandidateId,
  transcript: string,
  durationSeconds: number,
  notes?: string
): Promise<MUETExaminerReport> {
  const trimmed = (transcript || '').trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  
  if (wordCount < 10) {
    throw new Error('Not enough speech recorded. Please speak for at least 15 to 30 seconds so we can give you helpful feedback.');
  }

  const { count: fillerCount, words: fillerWords } = detectFillers(trimmed);
  const speechPace = estimateSpeechPace(wordCount, durationSeconds);
  const taskPrompt = topic.part1.tasks[candidate];

  const systemInstruction = `
Role: You are an encouraging MUET speaking coach for Malaysian students learning English as a second language (L2).
Task: Provide friendly, constructive speaking feedback for MUET Paper 800/2 Part 1 (Speaking on your own).

Tone & Language rules:
- Use simple, everyday English. Avoid complex linguistic jargon.
- When referring to criteria, explain them simply:
  * "Answering the question" (task fulfilment: addressing the assigned task with clear points)
  * "Natural flow and linking words" (fluency & coherence: smooth pacing, using words like "firstly", "because", "for example")
  * "Grammar and vocabulary" (accuracy and choosing clear words)
  * "Clarity and confidence" (speaking clearly and calmly)
- Scores are practice estimates (Band 1.0 to Band 5.0+), NEVER official Malaysian Examinations Council (MPM) results.
- Self-reflection note: Remind student about eye contact and looking up from notes as a self-check reminder for the real exam. DO NOT claim that you saw their eye contact or body language from the audio or text.
- Use exact quotes from the student transcript where possible. If suggesting improvements, provide one clear, easy sentence they can say instead.

JSON Schema to return:
{
  "overallBandEstimate": "Band 4.0 - Good User (CEFR B2)",
  "bandScoreNumber": 4.0,
  "taskFulfilment": {
    "score": 4,
    "maxScore": 5,
    "cefrLevel": "B2",
    "observations": ["You gave clear ideas that answered your prompt."],
    "suggestions": ["Add a real-life example to explain your second point further."]
  },
  "fluencyAndCoherence": {
    "score": 4,
    "maxScore": 5,
    "cefrLevel": "B2",
    "observations": ["Good pacing. You used linking words like 'moreover' and 'in addition'."],
    "suggestions": ["Take a calm breath instead of rushing when moving to your next point."]
  },
  "languageAndGrammar": {
    "score": 4,
    "maxScore": 5,
    "cefrLevel": "B2",
    "observations": ["Clear everyday sentences with few grammar slips."],
    "suggestions": ["Try using 'furthermore' instead of repeating 'and then'."]
  },
  "interactionAndCommunicativeCompetence": {
    "score": 4,
    "maxScore": 5,
    "cefrLevel": "B2",
    "observations": ["You had a clear introduction ('Good day everyone') and a polite finish."],
    "suggestions": ["Summarize your main idea clearly in your final sentence."]
  },
  "part1Evaluation": {
    "usedPERStructure": true,
    "mainPointsIdentified": ["First main point", "Second main point"],
    "openingGreetingDetected": true,
    "conclusionDetected": true
  },
  "transcriptEvidence": {
    "strongQuote": "Exact good sentence from transcript",
    "whyStrong": "Why this was clear and well-explained",
    "upgradeQuote": "A sentence from transcript that could be improved",
    "suggestedAlternative": "A simpler or more natural way to say it"
  },
  "strengths": [
    "You clearly answered your assigned task.",
    "Your ideas were easy to follow."
  ],
  "actionableSteps": [
    "Practice using the PER formula (Point, Example, Reason) for all 3 points.",
    "Speak at a steady, calm speed rather than rushing."
  ]
}
`;

  const userPrompt = `
Topic: "${topic.title}"
Situation: "${topic.part1.situation}"
Candidate: Speaker ${candidate}
Assigned Task: "${taskPrompt}"
Student Notes Taken During Prep: "${notes || 'None'}"
Spoken Transcript: "${trimmed}"
Word Count: ${wordCount}
Duration: ${durationSeconds} seconds
Fillers detected: ${fillerCount} (${fillerWords.join(', ')})
Estimated Pace: ${speechPace}
`;

  try {
    const rawResult = await generateJSONWithAI(
      systemInstruction + "\n\nReturn ONLY valid JSON.",
      userPrompt,
      'gemini-3.8-flash'
    );
    checkFeedback(rawResult, trimmed);

    return {
      id: 'muet_rep_' + Date.now(),
      testType: 'Part1',
      topicId: topic.id,
      topicTitle: topic.title,
      candidate,
      date: Date.now(),
      durationSeconds,
      overallBandEstimate: rawResult.overallBandEstimate || 'Band 3.5 - Modest User (CEFR B1)',
      bandScoreNumber: rawResult.bandScoreNumber || 3.5,
      wordCount,
      fillerCount,
      fillerWordsDetected: fillerWords,
      speechPaceEstimate: speechPace,
      disclaimer: 'Practice estimate based on CEFR-aligned MUET descriptors. This is not an official MPM exam result.',
      taskFulfilment: rawResult.taskFulfilment || {
        score: 3, maxScore: 5, cefrLevel: 'B1',
        observations: ['You spoke about the topic and shared your ideas.'],
        suggestions: ['Make sure to answer all parts of your assigned question.']
      },
      fluencyAndCoherence: rawResult.fluencyAndCoherence || {
        score: 3, maxScore: 5, cefrLevel: 'B1',
        observations: ['You kept talking with reasonable flow.'],
        suggestions: ['Use linking words like "firstly", "for example", and "therefore".']
      },
      languageAndGrammar: rawResult.languageAndGrammar || {
        score: 3, maxScore: 5, cefrLevel: 'B1',
        observations: ['Everyday vocabulary was understandable.'],
        suggestions: ['Check past tense verbs when sharing personal experiences.']
      },
      interactionAndCommunicativeCompetence: rawResult.interactionAndCommunicativeCompetence || {
        score: 3, maxScore: 5, cefrLevel: 'B1',
        observations: ['You shared an individual presentation clearly.'],
        suggestions: ['Start with "Good day everyone" and end with "Thank you for listening".']
      },
      part1Evaluation: rawResult.part1Evaluation || {
        usedPERStructure: true,
        mainPointsIdentified: ['Main idea presented'],
        openingGreetingDetected: trimmed.toLowerCase().includes('good day') || trimmed.toLowerCase().includes('good morning'),
        conclusionDetected: trimmed.toLowerCase().includes('thank you') || trimmed.toLowerCase().includes('in conclusion')
      },
      transcriptEvidence: rawResult.transcriptEvidence || {
        strongQuote: trimmed.slice(0, 80),
        whyStrong: 'Clear and directly related to the topic.',
        upgradeQuote: trimmed.slice(80, 160) || trimmed.slice(0, 80),
        suggestedAlternative: 'Try speaking in two shorter sentences for clarity.'
      },
      selfReflectionReminders: {
        eyeContactNote: 'Self-check: In the real exam, remember to look up at your peers and examiner rather than staring only at your paper.',
        notesDependenceNote: 'Self-check: Use your notes for quick reminder keywords, not for reading word-for-word.',
        bodyLanguageNote: 'Self-check: Sit upright, breathe calmly, and keep your hands relaxed on the table.'
      },
      strengths: rawResult.strengths || ['Good effort answering your assigned task on your own.'],
      actionableSteps: rawResult.actionableSteps || ['Keep practicing with the 2-minute timer to speak calmly and steadily.'],
      rawTranscript: trimmed
    };
  } catch (err) {
    throw new Error(getFriendlyErrorMessage(err));
  }
}

/**
 * Generates a realistic, concise, natural response for an AI peer in Part 2 group discussion.
 * Leaves space for the student and models good discussion skills (agreeing, adding ideas, asking others).
 */
export async function generateMUETPeerTurn(
  topic: MUETTopic,
  peerCandidate: MUETCandidateId,
  studentCandidate: MUETCandidateId,
  discussionHistory: MUETDiscussionTurn[],
  actionType: 'start' | 'respond' | 'invite' | 'agree' | 'conclude' = 'respond'
): Promise<{ text: string; skillType: 'Initiate' | 'Respond' | 'Develop' | 'Conclude' | 'Question' | 'Agreement' }> {
  const lastTurns = discussionHistory.slice(-5).map(t => `Speaker ${t.speaker}: "${t.content}"`).join('\n');
  const pointsList = topic.part2.points.map((p, i) => `${i + 1}. ${p}`).join('\n');

  const systemInstruction = `
Role: You are simulating Candidate ${peerCandidate} (Speaker ${peerCandidate}) in a MUET English group discussion exam (Paper 800/2 Part 2).
You are a friendly, realistic Malaysian college student candidate.

VERY IMPORTANT GUIDELINES:
1. Keep your reply CONCISE (2 to 4 sentences maximum, around 35-55 words).
2. Use natural, everyday Malaysian student English: clear, polite, and realistic (not robotic or overly academic).
3. Do NOT dominate the discussion. Always leave room for Candidate ${studentCandidate} (the user student) or invite another candidate.
4. Action requested: "${actionType}".
   - If "start": Open the group discussion politely: "Good day everyone. Shall we begin our discussion on ${topic.part2.centralQuestion}?" and mention one point briefly.
   - If "respond": Politely agree or partially agree with a previous point, then add one brief reason or everyday example.
   - If "invite": Share a quick thought and invite the student: "What do you think about this, Candidate ${studentCandidate}?"
   - If "agree": Agree with a point and move closer to consensus.
   - If "conclude": Propose a final decision politely: "Looking at our points, it seems most of us agree that... Do we all agree on this decision?"
5. Return JSON only:
{
  "text": "Your spoken words here",
  "skillType": "Respond"
}
Skill types must be one of: "Initiate", "Respond", "Develop", "Conclude", "Question", "Agreement".
`;

  const userPrompt = `
Topic: "${topic.title}"
Situation: "${topic.part2.situation}"
Central Question: "${topic.part2.centralQuestion}"
Suggested Points:
${pointsList}
Decision Needed: "${topic.part2.decisionPrompt}"

Recent discussion history:
${lastTurns || '(No turns yet - starting the discussion)'}
`;

  try {
    const res = await generateJSONWithAI(
      systemInstruction + "\n\nReturn ONLY valid JSON.",
      userPrompt,
      'gemini-3.8-flash'
    );
    if (res.text && typeof res.text === 'string') {
      return {
        text: res.text.trim(),
        skillType: res.skillType || 'Respond'
      };
    }
  } catch {
    throw new Error('The AI speaker is unavailable. Please try again.');
  }
  throw new Error('The AI speaker did not return a response. Please try again.');
}

/**
 * Analyzes MUET Part 2 (Group Discussion / Talking together)
 */
export async function analyzeMUETPart2(
  topic: MUETTopic,
  studentCandidate: MUETCandidateId,
  studentTurns: string[],
  fullHistory: MUETDiscussionTurn[],
  durationSeconds: number
): Promise<MUETExaminerReport> {
  const allStudentText = studentTurns.join(' ').trim();
  const wordCount = allStudentText ? allStudentText.split(/\s+/).length : 0;

  if (studentTurns.length === 0 || wordCount < 10) {
    throw new Error('You have not spoken enough in this discussion yet. Please take turns to share ideas, respond to peers, and reach an agreement.');
  }

  const { count: fillerCount, words: fillerWords } = detectFillers(allStudentText);
  const speechPace = estimateSpeechPace(wordCount, durationSeconds);

  // Check turn types
  const lowerText = allStudentText.toLowerCase();
  const invitedOthers = lowerText.includes('what do you think') || lowerText.includes('candidate') || lowerText.includes('how about you');
  const agreedPolitely = lowerText.includes('i agree') || lowerText.includes('good point') || lowerText.includes('you are right');
  const disagreedPolitely = lowerText.includes('however') || lowerText.includes('on the other hand') || lowerText.includes('i see your point but');
  const reachedAgreement = lowerText.includes('decide') || lowerText.includes('in conclusion') || lowerText.includes('consensus') || lowerText.includes('agree that');

  const systemInstruction = `
Role: You are an encouraging MUET speaking coach for Malaysian students learning English as a second language (L2).
Task: Provide constructive feedback for MUET Paper 800/2 Part 2 (Group Discussion / Talking together).

CRITICAL RULE:
- Assess ONLY the student's speaking turns (Speaker ${studentCandidate}).
- Do NOT assess or penalize the student for the AI peers' turns.
- Evaluate:
  1. Answering the question (discussing the suggested points and working towards the final decision)
  2. Interaction skills (initiating, building on ideas, polite disagreement, inviting others)
  3. Natural flow and linking words
  4. Grammar and clear everyday vocabulary
- Use simple, friendly English. Explain any unfamiliar terms.
- Remind about eye contact and looking at group members as a self-check reminder.

Return ONLY valid JSON matching this schema:
{
  "overallBandEstimate": "Band 4.0 - Good User (CEFR B2)",
  "bandScoreNumber": 4.0,
  "taskFulfilment": {
    "score": 4,
    "maxScore": 5,
    "cefrLevel": "B2",
    "observations": ["You contributed ideas to the group discussion."],
    "suggestions": ["Make sure to state your final decision clearly at the end."]
  },
  "fluencyAndCoherence": {
    "score": 4,
    "maxScore": 5,
    "cefrLevel": "B2",
    "observations": ["Good conversational turn-taking."],
    "suggestions": ["Use linking phrases like 'Building on what Candidate A said...'"]
  },
  "languageAndGrammar": {
    "score": 4,
    "maxScore": 5,
    "cefrLevel": "B2",
    "observations": ["Clear, accurate English in your turns."],
    "suggestions": ["Practice phrases for polite disagreement."]
  },
  "interactionAndCommunicativeCompetence": {
    "score": 4,
    "maxScore": 5,
    "cefrLevel": "B2",
    "observations": ["You listened and responded actively to the other speakers."],
    "suggestions": ["Remember to invite quiet candidates: 'What are your thoughts, Candidate C?'"]
  },
  "part2Evaluation": {
    "interactionTurnsCount": 4,
    "initiatingCount": 1,
    "respondingCount": 2,
    "politeDisagreementCount": 1,
    "invitedOthersCount": 1,
    "finalConsensusReached": true
  },
  "transcriptEvidence": {
    "strongQuote": "A good sentence spoken by student",
    "whyStrong": "Why this showed good interaction or explanation",
    "upgradeQuote": "A sentence that could be improved",
    "suggestedAlternative": "A smoother way to say it"
  },
  "strengths": [
    "You participated actively in the discussion.",
    "You responded politely to your group members."
  ],
  "actionableSteps": [
    "Practice inviting other candidates by name or letter.",
    "Help summarize the group's final decision before time runs out."
  ]
}
`;

  const userPrompt = `
Topic: "${topic.title}"
Central Question: "${topic.part2.centralQuestion}"
Decision prompt: "${topic.part2.decisionPrompt}"
Student Candidate: Speaker ${studentCandidate}
Student's Total Turns: ${studentTurns.length}
Student's Words: ${wordCount}
Duration: ${durationSeconds} seconds
Fillers detected: ${fillerCount} (${fillerWords.join(', ')})

Student's Spoken Utterances:
${studentTurns.map((t, i) => `Turn ${i + 1}: "${t}"`).join('\n')}
`;

  try {
    const rawResult = await generateJSONWithAI(
      systemInstruction + "\n\nReturn ONLY valid JSON.",
      userPrompt,
      'gemini-3.8-flash'
    );
    checkFeedback(rawResult, allStudentText);

    return {
      id: 'muet_rep_' + Date.now(),
      testType: 'Part2',
      topicId: topic.id,
      topicTitle: topic.title,
      candidate: studentCandidate,
      date: Date.now(),
      durationSeconds,
      overallBandEstimate: rawResult.overallBandEstimate || 'Band 4.0 - Good User (CEFR B2)',
      bandScoreNumber: rawResult.bandScoreNumber || 4.0,
      wordCount,
      fillerCount,
      fillerWordsDetected: fillerWords,
      speechPaceEstimate: speechPace,
      disclaimer: 'Practice estimate based on CEFR-aligned MUET descriptors. This is not an official MPM exam result.',
      taskFulfilment: rawResult.taskFulfilment || {
        score: 4, maxScore: 5, cefrLevel: 'B2',
        observations: ['You discussed the suggested points and contributed ideas.'],
        suggestions: ['Work together towards a clear final agreement.']
      },
      fluencyAndCoherence: rawResult.fluencyAndCoherence || {
        score: 4, maxScore: 5, cefrLevel: 'B2',
        observations: ['Good turn-taking and conversational flow.'],
        suggestions: ['Use phrases like "In addition to that" or "From another angle".']
      },
      languageAndGrammar: rawResult.languageAndGrammar || {
        score: 4, maxScore: 5, cefrLevel: 'B2',
        observations: ['Clear everyday sentences with good vocabulary.'],
        suggestions: ['Keep sentences clear and concise rather than too long.']
      },
      interactionAndCommunicativeCompetence: rawResult.interactionAndCommunicativeCompetence || {
        score: 4, maxScore: 5, cefrLevel: 'B2',
        observations: ['You interacted naturally with the other candidates.'],
        suggestions: ['Remember to invite others and check if everyone agrees.']
      },
      part2Evaluation: {
        interactionTurnsCount: studentTurns.length,
        initiatingCount: lowerText.includes('shall we begin') ? 1 : 0,
        respondingCount: agreedPolitely ? 2 : 1,
        politeDisagreementCount: disagreedPolitely ? 1 : 0,
        invitedOthersCount: invitedOthers ? 1 : 0,
        finalConsensusReached: reachedAgreement
      },
      transcriptEvidence: rawResult.transcriptEvidence || {
        strongQuote: allStudentText.slice(0, 90),
        whyStrong: 'Directly supported the discussion.',
        upgradeQuote: allStudentText.slice(90, 180) || allStudentText.slice(0, 90),
        suggestedAlternative: 'Try saying: "I agree with your point, and we can also add that..."'
      },
      selfReflectionReminders: {
        eyeContactNote: 'Self-check: In the real group exam, turn your body slightly towards whoever is speaking to show active listening.',
        notesDependenceNote: 'Self-check: Do not look down reading your notes during Part 2; this is a conversation, not a speech.',
        bodyLanguageNote: 'Self-check: Nod when peers share good points to show active encouragement.'
      },
      strengths: rawResult.strengths || ['Great teamwork and willingness to share ideas.'],
      actionableSteps: rawResult.actionableSteps || ['Keep practicing turning to other speakers: "Candidate C, what do you think?"'],
      rawTranscript: allStudentText
    };
  } catch (err) {
    throw new Error(getFriendlyErrorMessage(err));
  }
}

/**
 * Combines Part 1 and Part 2 into a complete MUET Full Mock Speaking Test Report.
 */
export async function analyzeMUETMockTest(
  topic: MUETTopic,
  candidate: MUETCandidateId,
  part1Report: MUETExaminerReport,
  part2Report: MUETExaminerReport
): Promise<MUETExaminerReport> {
  const combinedBandNumber = Number(((part1Report.bandScoreNumber + part2Report.bandScoreNumber) / 2).toFixed(1));
  let bandLabel = 'Band 3.5 - Modest User (CEFR B1)';
  if (combinedBandNumber >= 5.0) bandLabel = 'Band 5.0+ - Expert User (CEFR C1+)';
  else if (combinedBandNumber >= 4.5) bandLabel = 'Band 4.5 - Very Good User (CEFR C1)';
  else if (combinedBandNumber >= 4.0) bandLabel = 'Band 4.0 - Good User (CEFR B2)';
  else if (combinedBandNumber >= 3.5) bandLabel = 'Band 3.5 - Competent User (CEFR B1+)';
  else if (combinedBandNumber >= 3.0) bandLabel = 'Band 3.0 - Modest User (CEFR B1)';
  else bandLabel = 'Band 2.5 - Limited User (CEFR A2)';

  return {
    id: 'muet_mock_' + Date.now(),
    testType: 'Mock',
    topicId: topic.id,
    topicTitle: topic.title,
    candidate,
    date: Date.now(),
    durationSeconds: part1Report.durationSeconds + part2Report.durationSeconds,
    overallBandEstimate: bandLabel,
    bandScoreNumber: combinedBandNumber,
    wordCount: part1Report.wordCount + part2Report.wordCount,
    fillerCount: part1Report.fillerCount + part2Report.fillerCount,
    fillerWordsDetected: Array.from(new Set([...part1Report.fillerWordsDetected, ...part2Report.fillerWordsDetected])),
    speechPaceEstimate: part1Report.speechPaceEstimate,
    disclaimer: 'Practice estimate based on CEFR-aligned MUET descriptors. This is not an official MPM exam result.',
    taskFulfilment: {
      score: Math.round((part1Report.taskFulfilment.score + part2Report.taskFulfilment.score) / 2),
      maxScore: 5,
      cefrLevel: combinedBandNumber >= 4.0 ? 'B2' : 'B1',
      observations: [
        `Part 1: ${part1Report.taskFulfilment.observations[0] || 'Presented individual points'}`,
        `Part 2: ${part2Report.taskFulfilment.observations[0] || 'Contributed to group discussion'}`
      ],
      suggestions: [
        part1Report.taskFulfilment.suggestions[0] || 'Keep answering prompt fully',
        part2Report.taskFulfilment.suggestions[0] || 'Work towards final consensus'
      ]
    },
    fluencyAndCoherence: {
      score: Math.round((part1Report.fluencyAndCoherence.score + part2Report.fluencyAndCoherence.score) / 2),
      maxScore: 5,
      cefrLevel: combinedBandNumber >= 4.0 ? 'B2' : 'B1',
      observations: [
        `Part 1: ${part1Report.fluencyAndCoherence.observations[0] || 'See Part 1 feedback.'}`,
        `Pacing was ${part1Report.speechPaceEstimate.toLowerCase()} in Part 1 and ${part2Report.speechPaceEstimate.toLowerCase()} in Part 2.`
      ],
      suggestions: [
        'Use signpost words when moving between your main points.',
        'Take calm breaths instead of rushing.'
      ]
    },
    languageAndGrammar: {
      score: Math.round((part1Report.languageAndGrammar.score + part2Report.languageAndGrammar.score) / 2),
      maxScore: 5,
      cefrLevel: combinedBandNumber >= 4.0 ? 'B2' : 'B1',
      observations: [
        `Part 1: ${part1Report.languageAndGrammar.observations[0] || 'See Part 1 feedback.'}`,
        `Part 2: ${part2Report.languageAndGrammar.observations[0] || 'See Part 2 feedback.'}`
      ],
      suggestions: [
        'Practice combining shorter clauses with "furthermore", "however", or "as a result".'
      ]
    },
    interactionAndCommunicativeCompetence: {
      score: Math.round((part1Report.interactionAndCommunicativeCompetence.score + part2Report.interactionAndCommunicativeCompetence.score) / 2),
      maxScore: 5,
      cefrLevel: combinedBandNumber >= 4.0 ? 'B2' : 'B1',
      observations: [
        `Part 1: ${part1Report.interactionAndCommunicativeCompetence.observations[0] || 'See Part 1 feedback.'}`,
        `Part 2: ${part2Report.interactionAndCommunicativeCompetence.observations[0] || 'See Part 2 feedback.'}`
      ],
      suggestions: [
        'In Part 2, remember to invite quieter candidates to speak.',
        'Clearly state your group’s final agreed decision at the end.'
      ]
    },
    part1Evaluation: part1Report.part1Evaluation,
    part2Evaluation: part2Report.part2Evaluation,
    transcriptEvidence: part1Report.transcriptEvidence,
    selfReflectionReminders: {
      eyeContactNote: 'Self-check: In the real exam room, look up at your peers and examiner. Eye contact shows confidence.',
      notesDependenceNote: 'Self-check: Glance at your digital notes for keywords; avoid reading long sentences directly.',
      bodyLanguageNote: 'Self-check: Keep an upright, relaxed posture and listen actively to everyone at the table.'
    },
    strengths: [
      ...part1Report.strengths.slice(0, 1),
      ...part2Report.strengths.slice(0, 1),
      'Successfully completed the full 2-part MUET Speaking test simulation.'
    ],
    actionableSteps: [
      ...part1Report.actionableSteps.slice(0, 1),
      ...part2Report.actionableSteps.slice(0, 1)
    ],
    rawTranscript: `PART 1 TRANSCRIPT:\n${part1Report.rawTranscript}\n\nPART 2 TRANSCRIPT:\n${part2Report.rawTranscript}`
  };
}
