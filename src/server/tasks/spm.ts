import { PracticeSession } from "../../types";
import { normalizeSpeakingBankQuestion } from '../../lib/speakingTaskCompatibility';
import { withRetry } from "../retry";
import { analyzePhonemesAndPatterns } from "../../lib/phonemeAnalyzer";
import { getGenAI } from "../providerContext";
import { analyzeFeedbackWithChatGPT } from "../providerContext";

/**
 * Safely parses AI JSON output, handling cases where the AI might include markdown code blocks.
 */
function safeJsonParse(text: string): any {
  if (typeof text !== 'string') return text;
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    try {
      // 2. Try to extract from markdown code blocks
      // Handles both ```json { ... } ``` and ``` { ... } ```
      const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      
      // 3. Try to find the first '{' and last '}'
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      }
    } catch (innerE) {
      console.error("Failed to parse AI JSON response:", text);
      throw new Error("The AI returned an invalid response format. Please try again.");
    }
    throw new Error("The AI response could not be understood. Please try again.");
  }
}

export interface NLPConfig {
  useDeepFeedback?: boolean;
  wordCount?: number;
  isProPlus?: boolean;
  aiEngine?: 'gemini' | 'chatgpt';
}

export async function generateJSONWithAI(
  systemInstruction: string,
  userPrompt: string,
  model: string = "gemini-3.8-flash",
  config?: NLPConfig
): Promise<any> {
  // One server-side provider for every student feedback flow, regardless of old profile settings.
  const response = await analyzeFeedbackWithChatGPT(
    systemInstruction + "\n\nReturn ONLY valid JSON. Use short, simple English. Do not invent transcript evidence." +
      (config?.useDeepFeedback ? "\nDeep feedback is enabled: explain each score with specific text evidence, corrections and practical next steps. Keep explanations easy to understand." : "\nKeep feedback concise and useful."),
    userPrompt
  );
  const result = safeJsonParse(response);
  if (!result || typeof result !== 'object' || Array.isArray(result) || !Object.keys(result).length) {
    throw new Error('The AI feedback was incomplete. Your answer was not scored. Please try again.');
  }
  return result;
}

function checkMarks(result: any, keys: string[], max: number) {
  const hasFeedback = keys.includes('content')
    ? Array.isArray(result?.feedback?.strengths) && Array.isArray(result?.feedback?.improvements)
    : typeof result?.feedback === 'string' && result.feedback.trim().length > 0;
  if (!result?.marks || keys.some(key => !Number.isFinite(result.marks[key]) || result.marks[key] < 0 || result.marks[key] > max) || !hasFeedback) {
    throw new Error('The AI feedback was incomplete. Your answer was not scored. Please try again.');
  }
  result.marks.total = keys.reduce((sum, key) => sum + result.marks[key], 0);
}

function resolveModel(config?: NLPConfig): string {
  if (config?.useDeepFeedback) {
    return "gemini-3.1-pro-preview";
  }
  return "gemini-3.8-flash";
}

export async function analyzeSpeech(
  transcript: string,
  userGoal: string,
  config?: NLPConfig
): Promise<Partial<PracticeSession>> {
  const model = resolveModel(config);
  
  const pronunciationIssues = analyzePhonemesAndPatterns(transcript);
  const pronunciationContext = pronunciationIssues.length > 0 
    ? `\n    DETECTED MALAYSIAN PRONUNCIATION/GRAMMAR PATTERNS:\n    ${pronunciationIssues.map(i => `- Issue: ${i.issue}\n      Suggestion: ${i.suggestion}`).join('\n    ')}\n    CRITICAL: Incorporate these specific detected issues into your feedback, particularly in the Pronunciation or Grammar sections.`
    : "";
  
  const systemInstruction = `
    Role: Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert Gamification Engineer and Educational Content Designer specializing in the Malaysian SPM English syllabus for EZ Academy.
    Objective: Convert standard English learning materials into engaging, competitive, and shareable gaming experiences.
    ${pronunciationContext}
    
    Analyze the provided transcript for students preparing for ${userGoal}. Calculate not just "correct/incorrect," but assign "XP" (Experience Points) and "EZ Coins" based on speed and accuracy.
    
    ASSESSMENT REFERENCE:
    - Fluency: Natural flow, minimal hesitation, appropriate speed.
    - Grammar: Accuracy and variety of structures (simple and complex).
    - Vocabulary: Range and appropriateness for the goal.
    - Structure: Coherence and use of connecting words.
    
    EVIDENCE-BASED FEEDBACK: Cite specific examples from the transcript to justify your analysis.
    Feedback Tone: Use an encouraging, "coach-like" persona. Mix professional English with occasional Malaysian cultural context (e.g., acknowledging SPM pressures or goals).

    Provide feedback in Markdown format. The output MUST be highly organized, visually structured, and concise.
    Use short bullet points to summarize feedback. DO NOT USE LENGTHY SENTENCES.
    
    Include EXACTLY the following sections organized with clear headings:
    - **ðŸ† User Evaluation**: State Score (0-100), XP earned (10-100), and EZ Coins (5-50).
    - **âš–ï¸ Strengths/Weaknesses**: 2 bullet points detailing what they did well and where to grow.
    - **ðŸ… Achievement Unlocked**: A creative name for a badge if they did well.
    - **ðŸ“² Shareable Snippet**: A short, catchy text for Instagram/TikTok highlighting their SPM English journey.
    - **ðŸ”— Fluency & Coherence**: Evaluate the use of **linking words** (e.g., 'furthermore', 'nevertheless') to connect ideas (2-3 specific suggestions).
    - **â±ï¸ Speech Pacing**: 1-2 bullets on the **pace of speech** (natural flow, pauses, or speed).
    - **ðŸ—£ï¸ Pronunciation (Malaysian Context)**: 2-3 actionable tips for common Malaysian English patterns (e.g., endings, 'th' sounds).
    
    Also provide scores (0-100) for these metrics:
    - Fluency
    - Grammar
    - Vocabulary
    - Comprehension
    - Pronunciation (Estimated from text context)
    - Structure
    
    Return ONLY valid JSON matching this exact structure:
    {
      "feedback": "string (markdown text)",
      "metrics": {
        "fluency": 0,
        "grammar": 0,
        "vocabulary": 0,
        "comprehension": 0,
        "pronunciation": 0,
        "structure": 0
      },
      "userEvaluation": {
        "xp": 0,
        "coins": 0,
        "achievement": "string",
        "shareableSnippet": "string"
      }
    }
  `;

  let result: any = {};
  try {
    result = await generateJSONWithAI(
      systemInstruction,
      `Transcript: "${transcript}"`,
      model,
      config
    );
  } catch (err: any) {
    throw err;
  }

  if (!result.feedback || !result.metrics || ['fluency', 'grammar', 'vocabulary', 'comprehension', 'pronunciation', 'structure'].some(key => !Number.isFinite(result.metrics[key]))) throw new Error('The AI feedback was incomplete. Your answer was not scored. Please try again.');
  result.metrics = result.metrics || {
    fluency: 0,
    grammar: 0,
    vocabulary: 0,
    comprehension: 0,
    pronunciation: 0,
    structure: 0
  };

  return {
    feedback: result.feedback || "No feedback generated.",
    metrics: result.metrics,
    userEvaluation: result.userEvaluation,
    transcript,
    score: Math.round(
      Object.values(result.metrics as Record<string, number>).reduce((a, b) => a + Number(b), 0) / 6
    ) || 0,
  };
}

export interface SPMTask {
  theme: string;
  friendName?: string;
  friendEmail?: string;
  subject?: string;
  situation?: string;
  emailBody?: string;
  title?: string;
  context?: string;
  bulletPoints?: string[];
  practiceMode: 'Full' | 'Introduction' | 'Body' | 'Conclusion';
  essayType?: 'Article' | 'Email' | 'Story' | 'Review' | 'Speech' | 'Report';
  partialEssay?: string;
}

export async function generateSPMEmailTask(requestedTheme?: string): Promise<SPMTask> {
  const model = "gemini-3.8-flash";
  
  const themeConstraint = requestedTheme 
    ? `STRICT THEME: You MUST generate a task for the theme "${requestedTheme}".`
    : `RANDOMISATION LOGIC: 1. Randomly select ONE theme: People and Culture, Health and Environment, Science and Technology, or Consumerism and Financial Awareness.`;

  const systemInstruction = `
    Role: Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert Gamification Engineer and Educational Content Designer specializing in the Malaysian SPM English syllabus.
    Objective: Generate a "Short Email" task for PART 1 of the SPM Writing paper, but frame it internally as a "Micro-Challenge" or "Boss Battle".
    
    ${themeConstraint}
    2. Randomly generate a friend's name and email:
       - Use a highly diverse mix of Malaysian names.
    3. Randomly generate a purpose/situation context based on the theme.
    4. Ensure the situation context is highly relatable to Malaysian teenagers (e.g., local food festivals, school co-curricular activities, e-wallet spending habits, recycling projects at home, online gaming, study group challenges).
    5. VARY COMMUNICATIVE FUNCTIONS: The email stimulus should require the student to perform a mix of functions: advising, suggesting, inviting/declining, justifying a choice, or solving a problem. 
    
    GAMIFICATION NOTE: In the 'situation' description, subtly frame the scenario as a "Mini-Boss Battle" or "XP Challenge". (e.g., "Your friend is facing a difficult challenge and needs your advice!").
    
    STRICT FORMAT:
    - The email begins with "Hi," and ends with "Bye for now!".
    - Include EXACTLY 3 specific questions/prompts for the student to answer.
    
    Return ONLY valid JSON matching this exact structure:
    {
      "theme": "string",
      "friendName": "string",
      "friendEmail": "string",
      "subject": "string",
      "situation": "string",
      "emailBody": "string"
    }
  `;

  const result = await withRetry(async () => {
    const result = await getGenAI().models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: "Generate a new SPM Part 1 Email task." }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    return safeJsonParse(result.text || "{}");
  });

  return { ...result, practiceMode: 'Full' };
}

export async function generateSPMPart2Task(mode: 'Full' | 'Introduction' | 'Body' | 'Conclusion' = 'Full', requestedTheme?: string): Promise<SPMTask> {
  const model = "gemini-3.8-flash";
  
  const themeConstraint = requestedTheme 
    ? `STRICT THEME: You MUST generate a task for the theme "${requestedTheme}".`
    : `RANDOMISATION LOGIC: 1. Randomly select ONE theme: People and Culture, Health and Environment, Science and Technology, or Consumerism and Financial Awareness.`;

  const systemInstruction = `
    Role: Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert Gamification Engineer and Educational Content Designer specializing in the Malaysian SPM English syllabus.
    Objective: Generate a "Guided Writing" task for PART 2 of the SPM Writing paper, framed internally as an intense "Essay Boss Battle" or "XP Challenge".
    
    ${themeConstraint}
    
    SCENARIO DIVERSITY & CONTEXTUAL HARDENING (BOSS BATTLE MODE):
    - Focus on relatable social events, community challenges, or problem-solving situations for Malaysian teenagers.
    - Examples: Organizing a school charity drive, dealing with a neighborhood safety issue, addressing a rise in cyberbullying, planning a sustainable youth camp, managing a group project conflict, or suggesting improvements for local public transport.
    - Frame the "situation" subtly as an epic challenge that requires their writing skills to save the day/solve the crisis. 
    
    QUESTION FORMAT (MUST FOLLOW STRICTLY):
    - PART 2 [20 marks]
    - You must answer this question.
    - Question 2
    - Generate a situation in this EXACT style: "You and your friends have been talking about [topic/issue]. Your teacher has asked you to write an essay on this [issue/situation]."
    - Followed by: "In your essay, you should write about:"
    - Provide EXACTLY 3 specific bullet points (Point 1, Point 2, Point 3). 
    - Each bullet must be clear and framed to encourage deep elaboration using the PEEL method.
    - Points should follow a logical progression, e.g.:
      1. One point for identifying/describing the core issue or event.
      2. One point for explaining a cause, benefit, or challenge.
      3. One point for providing a suggestion, solution, or personal recommendation.
    - Followed by: "Write your essay in 125â€“150 words in an appropriate style. Write your essay using all of the notes."
    
    MODULAR PRACTICE MODE:
    Practice Mode selected: ${mode}.
    
    STRICT MODULAR CONSTRAINTS:
    - If Mode is "Introduction": The context MUST emphasize writing an effective lead-in, giving background, and a clear thesis statement. Topic must be relevant for a full essay but the prompt focuses only on the start.
    - If Mode is "Body": The context MUST explicitly command: "Write ONE body paragraph using the PEEL method (Point, Elaboration, Example, Link). Choose ONLY ONE of the 3 bullet points provided to expand."
    - If Mode is "Conclusion": The context MUST emphasize summarizing the main arguments and providing a meaningful closing thought or recommendation.
    - If Mode is "Full": No additional modular instructions needed.
    
    Return ONLY valid JSON matching this exact structure:
    {
      "theme": "string",
      "title": "string",
      "context": "string",
      "bulletPoints": ["string"],
      "modularInstruction": "string"
    }
  `;

  const result = await withRetry(async () => {
    const result = await getGenAI().models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `Generate a new SPM Part 2 Guided Writing task for ${mode} practice.` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
    return safeJsonParse(result.text || "{}");
  });

  return { 
    ...result, 
    practiceMode: mode,
    context: result.modularInstruction ? `${result.context}\n\n${result.modularInstruction}` : result.context
  };
}

export async function analyzeSPMPart2(
  task: SPMTask,
  studentResponse: string,
  config?: NLPConfig
): Promise<any> {
  const model = resolveModel(config);
  
  const systemInstruction = `
    Role: Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert Gamification Engineer and Educational Content Designer specializing in the Malaysian SPM English syllabus.
    Objective: Evaluate a studentâ€™s modular writing response for Paper 2 Part 2 (Guided Writing) and convert standard feedback into an engaging, competitive snippet.
    
    TASK CONTEXT:
    - Topic: ${task.title}
    - Situation: ${task.context}
    - Bullet Points: ${task.bulletPoints?.join(', ')}
    - Practice Mode: ${task.practiceMode} (Introduction, Body Paragraph, or Conclusion)
    
    YOUR TASK:
    Evaluate the response based on its specific modular requirement. (20 marks total scale, even for partial tasks, to maintain consistency in reporting).
    Calculate not just traditional marks, but assign "XP" (Experience Points) and "EZ Coins" based on their performance.
    Use an encouraging, "coach-like" persona. Mix professional English with occasional Malaysian cultural context (e.g., acknowledging SPM pressures or goals).

    MARKING CRITERIA (Adjusted for ${task.practiceMode}):
    - CONTENT (0-5): Relevant ideas? Addresses the specific focus?
      * Descriptor: Band 5 (All content relevant), Band 3 (Mostly relevant), Band 1 (Minimally relevant).
    - COMMUNICATIVE ACHIEVEMENT (0-5): Appropriate tone? Effective structure?
      * Descriptor: Band 5 (Ease of communication), Band 3 (Straightforward ideas), Band 1 (Simple ways).
    - ORGANISATION (0-5): Linkers? (For Body: Did they use PEEL? For Intro/Conclusion: Clear flow?)
      * Descriptor: Band 5 (Coherent, variety of linkers), Band 3 (Connected, basic linkers), Band 1 (List-like).
    - LANGUAGE (0-5): Grammar accuracy, range, and vocabulary.
      * Descriptor: Band 5 (Wide range, good control), Band 3 (Everyday range, control of simple forms), Band 1 (Basic range, some control).
    
    EVIDENCE-BASED FEEDBACK: You MUST cite specific sentences or phrases from the student's text to justify the marks for each category.
    
    MODULAR CHECKLIST:
    - Introduction: Clear lead-in? Background? Thesis?
    - Body (PEEL): Point clear? Elaborated? Example given? Linked back?
    - Conclusion: Summary of ideas? Final recommendation/thought?
    
    OUTPUT FORMAT:
    For the level field choose exactly one of Excellent (Band 5), Average (Band 3), or Weak (Band 1), using the marking descriptors and your evaluation. Do not copy example placeholder values. For bullet status use the exact Unicode character ✅ when satisfied or ❌ when unmet.
    Return ONLY valid JSON matching this exact structure:
    {
      "marks": { "content": 0, "commAchievement": 0, "organisation": 0, "language": 0, "total": 0 },
      "level": "<choose Excellent, Average, or Weak>",
      "levelReason": "string",
      "feedback": { "strengths": ["string"], "improvements": ["string"] },
      "corrections": "string",
      "bulletCheck": [ { "question": "Modular Requirement", "status": "✅", "comment": "string" } ],
      "bonusTip": "string",
      "userEvaluation": { "xp": 0, "coins": 0, "achievement": "string", "shareableSnippet": "string" },
      "rawFeedback": "string"
    }
  `;

  const result = await generateJSONWithAI(
    systemInstruction,
    `Student Answer for ${task.practiceMode}: "${studentResponse}"`,
    model,
    config
  );
  
  checkMarks(result, ['content', 'commAchievement', 'organisation', 'language'], 5);
  result.marks = result.marks || { content: 0, commAchievement: 0, organisation: 0, language: 0, total: 0 };
  result.marks.total = result.marks.total || ((result.marks.content || 0) + (result.marks.commAchievement || 0) + (result.marks.organisation || 0) + (result.marks.language || 0));

  result.metrics = {
    fluency: (result.marks.commAchievement || 0) * 20,
    grammar: (result.marks.language || 0) * 20,
    vocabulary: (result.marks.language || 0) * 20,
    comprehension: (result.marks.content || 0) * 20,
    pronunciation: 0,
    structure: (result.marks.organisation || 0) * 20, 
  };
  result.score = Math.round((result.marks.total / 20) * 100);
  if (isNaN(result.score)) result.score = 0;
  
  return result;
}

export async function analyzeSPMFullEssay(
  task: SPMTask,
  fullEssay: string,
  config?: NLPConfig
): Promise<any> {
  const model = resolveModel(config);
  
  const systemInstruction = `
    Role: Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert Gamification Engineer and Educational Content Designer specializing in the Malaysian SPM English syllabus.
    Objective: Evaluate a full essay for Paper 2 Part 2 (Guided Writing) and provide an engaging, gamified evaluation.
    
    TASK CONTEXT:
    - Topic: ${task.title}
    - Situation: ${task.context}
    - Bullet Points: ${task.bulletPoints?.join(', ')}
    
    YOUR TASK:
    Evaluate the response. Calculate not just traditional marks, but assign "XP" (Experience Points) and "EZ Coins" based on their performance.
    Use an encouraging, "coach-like" persona. Mix professional English with occasional Malaysian cultural context (e.g., acknowledging SPM pressures or goals).

    MARKING SCHEME (SPM BAND 1-5):
    - CONTENT (0-5):
      * 5: All content is relevant. Target reader fully informed.
      * 3: Mostly relevant. Target reader on the whole informed.
      * 1: Little relevance. Target reader minimally informed.
    - COMMUNICATIVE ACHIEVEMENT (0-5):
      * 5: Uses conventions effectively to hold reader's attention. Communicates with ease.
      * 3: Uses conventions in generally appropriate ways. Communicates straightforward ideas.
      * 1: Communicates simple ideas in simple ways.
    - ORGANISATION (0-5):
      * 5: Well-organised and coherent. Variety of cohesive devices used effectively.
      * 3: Connected and coherent. Uses basic linking words and limited cohesive devices.
      * 1: List of related sentences. Simple connectors (and, but, because).
    - LANGUAGE (0-5):
      * 5: Range of vocabulary including less common lexis. Range of simple and complex forms with good control. 
      * 3: Everyday vocabulary. Simple grammatical forms with good control.
      * 1: Basic vocabulary. Simple grammatical forms with some control. Errors may impede communication.

    TOTAL SCORE: 20 marks.
    
    DEEP FEEDBACK MODE (if useDeepFeedback is true): Provide line-specific corrections and explain WHY the mark was given based on the descriptors above.
    
    OUTPUT FORMAT:
    For the level field choose exactly one of Excellent (Band 5), Average (Band 3), or Weak (Band 1), using the marking descriptors and your evaluation. Do not copy example placeholder values. For bullet status use the exact Unicode character ✅ when satisfied or ❌ when unmet.
    Return ONLY valid JSON matching this exact structure:
    {
      "marks": { "content": 0, "commAchievement": 0, "organisation": 0, "language": 0, "total": 0 },
      "level": "<choose Excellent, Average, or Weak>",
      "levelReason": "string",
      "feedback": { "strengths": ["string"], "improvements": ["string"] },
      "corrections": "string",
      "bulletCoverage": [
        { "point": "Point 1", "status": "✅", "comment": "string" },
        { "point": "Point 2", "status": "✅", "comment": "string" },
        { "point": "Point 3", "status": "❌", "comment": "string" }
      ],
      "bonusTip": "string",
      "userEvaluation": { "xp": 0, "coins": 0, "achievement": "string", "shareableSnippet": "string" },
      "rawFeedback": "string"
    }
  `;

  const result = await generateJSONWithAI(
    systemInstruction,
    `Full Essay Submission: "${fullEssay}"`,
    model,
    config
  );
  
  checkMarks(result, ['content', 'commAchievement', 'organisation', 'language'], 5);
  result.marks = result.marks || { content: 0, commAchievement: 0, organisation: 0, language: 0, total: 0 };
  result.marks.total = result.marks.total || ((result.marks.content || 0) + (result.marks.commAchievement || 0) + (result.marks.organisation || 0) + (result.marks.language || 0));

  result.metrics = {
    fluency: (result.marks.commAchievement || 0) * 20,
    grammar: (result.marks.language || 0) * 20,
    vocabulary: (result.marks.language || 0) * 20,
    comprehension: (result.marks.content || 0) * 20,
    pronunciation: 0,
    structure: (result.marks.organisation || 0) * 20, 
  };
  result.score = Math.round((result.marks.total / 20) * 100);
  if (isNaN(result.score)) result.score = 0;
  
  // Map bulletCoverage to bulletCheck format for UI compatibility if needed
  result.bulletCheck = (result.bulletCoverage || []).map((b: any) => ({
    question: b.point,
    status: b.status,
    comment: b.comment
  }));

  return result;
}

export async function analyzeSPMEmail(
  task: SPMTask,
  studentResponse: string,
  config?: NLPConfig
): Promise<any> {
  const model = resolveModel(config);
  
  const systemInstruction = `
    Role: Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert Gamification Engineer and Educational Content Designer specializing in the Malaysian SPM English syllabus.
    Objective: Evaluate a studentâ€™s answer for Paper 2 Part 1 (Short Communicative Email) and provide an engaging, gamified evaluation.
    
    TASK CONTEXT:
    - Situation: ${task.situation}
    - Friend's Email: ${task.emailBody}
    
    YOUR TASK:
    Evaluate the response according to official SPM criteria.
    1. Content (0â€“5): Answered all questions? Relevant ideas? Sufficient development?
    2. Communicative Achievement (0â€“5): Proper email format? Appropriate tone (informal/friendly)? Natural reply?
    3. Organisation (0â€“5): Message flow? Linkers? Cohesive devices?
    4. Language (0â€“5): Grammar accuracy? Vocabulary range? Sentence structure?
    
    DETAILED BAND DESCRIPTORS:
    - Band 5 (Mastery): All content relevant. effectively holds reader's attention. Well-organised. Range of vocabulary and complex forms with control.
    - Band 3 (Standard): Mostly relevant. Communicates straightforward ideas. Connected and coherent. Simple forms with control.
    - Band 1 (Developing): Minimally relevant. Simple ideas. List-like organization. Basic vocabulary and some control of simple forms.

    Calculate not just traditional marks, but assign "XP" (Experience Points) and "EZ Coins" based on their performance.
    
    OUTPUT FORMAT:
    For the level field choose exactly one of Excellent (Band 5), Average (Band 3), or Weak (Band 1), using the marking descriptors and your evaluation. Do not copy example placeholder values. For bullet status use the exact Unicode character ✅ when satisfied or ❌ when unmet.
    Return ONLY valid JSON matching this exact structure:
    {
      "marks": { "content": 0, "commAchievement": 0, "organisation": 0, "language": 0, "total": 0 },
      "level": "<choose Excellent, Average, or Weak>",
      "levelReason": "string",
      "feedback": { "strengths": ["string"], "improvements": ["string"] },
      "corrections": "string",
      "bulletCheck": [ { "question": "string", "status": "✅", "comment": "string" } ],
      "bonusTip": "string",
      "userEvaluation": { "xp": 0, "coins": 0, "achievement": "string", "shareableSnippet": "string" },
      "rawFeedback": "string"
    }
  `;

  const result = await generateJSONWithAI(
    systemInstruction,
    `Student Answer: "${studentResponse}"`,
    model,
    config
  );
  
  // Map back to our PracticeSession metrics format for consistency in charts
  checkMarks(result, ['content', 'commAchievement', 'organisation', 'language'], 5);
  result.marks = result.marks || { content: 0, commAchievement: 0, organisation: 0, language: 0, total: 0 };
  result.marks.total = result.marks.total || ((result.marks.content || 0) + (result.marks.commAchievement || 0) + (result.marks.organisation || 0) + (result.marks.language || 0));

  result.metrics = {
    fluency: (result.marks.commAchievement || 0) * 20,
    grammar: (result.marks.language || 0) * 20,
    vocabulary: (result.marks.language || 0) * 20,
    comprehension: (result.marks.content || 0) * 20,
    pronunciation: 0, // Not applicable for text
    structure: (result.marks.organisation || 0) * 20, 
  };
  result.score = Math.round((result.marks.total / 20) * 100);
  if (isNaN(result.score)) result.score = 0;
  
  return result;
}

export async function modularizeSPMTask(task: SPMTask, mode: 'Introduction' | 'Body' | 'Conclusion'): Promise<SPMTask> {
  const model = "gemini-3.8-flash";
  
  const systemInstruction = `
    Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert SPM English language examiner.
    A student is practicing a portion of an SPM essay.
    
    TASK: ${task.context}
    TYPE: ${task.essayType || 'Essay'}
    THEME: ${task.theme}
    BULLET POINTS: ${task.bulletPoints?.join(', ')}
    
    MODULAR LOGIC:
    - If Mode is "Introduction": Return only the TITLE for the essay. The student will write the intro. Focus the instruction on crafting an effective hook, background information, and a clear thesis statement.
    - If Mode is "Body": Return the TITLE and a high-quality sample INTRODUCTION (approx 30-50 words). The student will write one body paragraph using the PEEL (Point, Elaboration, Example, Link) method.
    - If Mode is "Conclusion": Return the TITLE, a sample INTRODUCTION, and 2-3 sample BODY paragraphs (approx 150-180 words total). The student will write the conclusion, focusing on summarizing main points and a powerful closing thought.
    
    Return ONLY valid JSON matching this exact structure:
    {
      "partialEssay": "string",
      "modularInstruction": "string"
    }
  `;

  const sdkResponse = await withRetry(async () => {
    return await getGenAI().models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `Modularize this task for ${mode} practice.` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
  });

  const result = safeJsonParse(sdkResponse.text || "{}");

  return { 
    ...task, 
    partialEssay: result.partialEssay,
    practiceMode: mode,
    context: `${task.context.split('\n\nPractice Task:')[0]}\n\n${result.modularInstruction}`
  };
}

export async function generateSPMPart3Task(
  type: 'Article' | 'Email' | 'Story' | 'Review' | 'Speech' | 'Report', 
  theme: string,
  mode: 'Full' | 'Introduction' | 'Body' | 'Conclusion' = 'Full'
): Promise<SPMTask> {
  const model = "gemini-3.8-flash";
  
  const systemInstruction = `
    Role: Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert Gamification Engineer and Educational Content Designer specializing in the Malaysian SPM English syllabus.
    Objective: Generate an "Extended Writing" task for PART 3 of the SPM Writing paper (20 marks) for a ${type}, framed as an epic "Final Boss Battle".
    
    STRICT THEME: ${theme}.
    STRICT MODE: ${mode}.

    TASK FORMAT:
    - Describe a scenario or prompt appropriate for a ${type}.
    - Subtly frame the task description as an epic challenge that tests their absolute mastery of English.
    - Include 3 specific bullet points or guidance notes.
    - Word count requirement: 200 - 250 words.
    
    MODULAR LOGIC:
    - If Mode is "Introduction": Provide a "partialEssay" (string) which is the TITLE and then STOP. The user is tasked to write only the INTRODUCTION.
    - If Mode is "Body": Provide a "partialEssay" (string) that includes the TITLE and a sample INTRODUCTION. The user is tasked to write ONE strong body paragraph for ONE of the bullet points.
    - If Mode is "Conclusion": Provide a "partialEssay" (string) that includes the TITLE, INTRODUCTION, and BODY paragraphs. The user is tasked to write only the CONCLUSION.
    - If Mode is "Full": partialEssay should be empty.

    Return ONLY valid JSON matching this exact structure:
    {
      "title": "string",
      "context": "string",
      "bulletPoints": ["string"],
      "theme": "${theme}",
      "essayType": "${type}",
      "partialEssay": "string",
      "modularInstruction": "string"
    }
  `;

  const sdkResponse = await withRetry(async () => {
    return await getGenAI().models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `Generate a Part 3 ${type} task in ${mode} mode.` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });
  });
  const result = safeJsonParse(sdkResponse.text || "{}");

  return { 
    ...result, 
    practiceMode: mode, 
    essayType: type,
    context: result.modularInstruction ? `${result.context}\n\n${result.modularInstruction}` : result.context
  };
}

export async function analyzeSPMPart3(task: SPMTask, essay: string, essayType: string, config?: NLPConfig) {
  const model = resolveModel(config);
  
  const isModular = task.practiceMode !== 'Full';
  
  const systemInstruction = `
    Role: Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert Gamification Engineer and Educational Content Designer specializing in the Malaysian SPM English syllabus.
    Objective: Analyze this PART 3 ${essayType} based on SPM standards (CEFR B2 level) and provide an engaging, gamified evaluation.
    
    PRACTICE MODE: ${task.practiceMode}
    ${isModular ? `This is a modular task. The user was asked to write only the ${task.practiceMode}. Focus your evaluation on the quality of this specific part, its relevance to the prompt, and how well it fits with any provided partial essay.` : ''}

    YOUR TASK:
    Evaluate the response. Calculate not just traditional marks, but assign "XP" (Experience Points) and "EZ Coins" based on their performance.
    Use an encouraging, "coach-like" persona. Mix professional English with occasional Malaysian cultural context (e.g., acknowledging SPM pressures or goals).

    The criteria are:
    1. Content (0-5 marks): BAND 5: All relevant. BAND 3: Mostly relevant. BAND 1: minimally relevant. (Did they cover all requirements?)
    2. Communicative Achievement (0-5 marks): BAND 5: Ease of communication. BAND 3: Straightforward ideas. BAND 1: Simple ways. (Is the tone appropriate?)
    3. Organisation (0-5 marks): BAND 5: Well-organised/coherent. BAND 3: Connected/coherent. BAND 1: List-like. (Is the text structured logically?)
    4. Language (0-5 marks): BAND 5: Wide range/Control. BAND 3: Everyday range/Control of simple forms. BAND 1: Basic vocabulary/Some control. (Grammar accuracy, sentence variety, and vocabulary range.)

    EVIDENCE-BASED FEEDBACK: You MUST cite specific sentences or phrases from the student's text to justify the marks for each category.

    ${isModular ? 'IMPORTANT: Adjust scoring to focus on the specific section written. Marks should reflect the potential of this section to contribute to a Full Band 5 essay.' : 'MARKING SCHEME (SPM BAND 1-5): Evaluate strictly according to the four categories above.'}
    
    Return ONLY valid JSON matching this exact structure:
    {
      "marks": { "content": 0, "commAchievement": 0, "organisation": 0, "language": 0, "total": 0 },
      "level": "<choose Excellent, Average, or Weak>",
      "levelReason": "string",
      "feedback": { "strengths": ["string"], "improvements": ["string"] },
      "corrections": "string",
      "bulletCoverage": [
        { "point": "Point 1", "status": "✅", "comment": "string" },
        { "point": "Point 2", "status": "❌", "comment": "string" },
        { "point": "Point 3", "status": "✅", "comment": "string" }
      ],
      "bonusTip": "string",
      "userEvaluation": { "xp": 0, "coins": 0, "achievement": "string", "shareableSnippet": "string" },
      "rawFeedback": "string"
    }
  `;

  const result = await generateJSONWithAI(
    systemInstruction,
    `Task: ${JSON.stringify(task)}\n\nProvided Text (if any): ${task.partialEssay || 'None'}\n\nUser Written Content:\n${essay}`,
    model,
    config
  );
  
  checkMarks(result, ['content', 'commAchievement', 'organisation', 'language'], 5);
  result.marks = result.marks || { content: 0, commAchievement: 0, organisation: 0, language: 0, total: 0 };
  result.marks.total = result.marks.total || ((result.marks.content || 0) + (result.marks.commAchievement || 0) + (result.marks.organisation || 0) + (result.marks.language || 0));

  result.metrics = {
    fluency: (result.marks.commAchievement || 0) * 20,
    grammar: (result.marks.language || 0) * 20,
    vocabulary: (result.marks.language || 0) * 20,
    comprehension: (result.marks.content || 0) * 20,
    pronunciation: 0,
    structure: (result.marks.organisation || 0) * 20, 
  };
  result.score = Math.round((result.marks.total / 20) * 100);
  if (isNaN(result.score)) result.score = 0;
  
  result.bulletCheck = (result.bulletCoverage || []).map((b: any) => ({
    question: b.point,
    status: b.status,
    comment: b.comment
  }));

  return result;
}

export interface SPMSpeakingTask {
  fallback?: boolean;
  part: 1 | 2 | 3;
  topic?: string;
  introduction?: string;
  questions?: string[]; // For Part 1
  promptCard?: {
    topic: string;
    prompts: string[];
    prepTip?: string;
  }; // For Part 2
  discussion?: {
    situation: string;
    points: string[];
    guides?: string[];
    decisionQuestion?: string;
    hotQuestion?: string;
  }; // For Part 3
}

export async function generateSPMSpeakingTask(part: 1 | 2 | 3 | 'Full', theme?: string, recentTopics: string[] = []): Promise<SPMSpeakingTask> {
  const model = "gemini-3.8-flash";
  const seed = Math.floor(Math.random() * 1000000);
  
  const systemInstruction = `
    Role: Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert Gamification Engineer and Educational Content Designer specializing in the Malaysian SPM English syllabus.
    Objective: Generate a unique, highly varied speaking task for Part ${part}. Use entropy seed ${seed} to ensure unique question selection.
    
    ${theme ? `PRIMARY THEME & CONTEXT: ${theme}. You MUST focus all questions on this specific theme. DO NOT use generic topics like 'hobbies' or 'school life' unless strictly relevant to the theme.` : 'CRITICAL: You MUST produce a BRAND NEW, UNIQUE topic every time. Explore diverse themes: Environment, Technology, Local Traditions, Health, Future Careers, Travel, Shopping, Media, global issues, etc. AVOID common tropes.'}
    
    ${recentTopics.length > 0 ? `PREVIOUSLY USED TOPICS (DO NOT REPEAT THESE): ${recentTopics.join(', ')}` : ''}
    
    GUIDELINES:
    Part 1 (Interview): Generate exactly 4 semi-personal questions relevant to the theme. ENSURE THE QUESTIONS ARE FRESH AND DIFFERENT from any standard set.
    Part 2 (Individual Long Turn): Generate a unique topic card with 3 specific prompts. Provide an encouraging AI 'introduction' that sets the context (e.g., "In this part, I'd like you to talk about... Here is your topic card.").
    Part 3 (Discussion): Generate a situation with 4 points, a decision question, and a HOT question. Include guidance tips. Provide an encouraging AI 'introduction' that sets the context (e.g., "Now, I'd like you to talk about something with me/for three minutes...").
    
    Return ONLY valid JSON matching this exact structure:
    {
      "part": 1,
      "topic": "string",
      "introduction": "string",
      "questions": ["string"],
      "promptCard": { "topic": "string", "prompts": ["string"] },
      "discussion": { "situation": "string", "points": ["string"], "guides": ["string"], "decisionQuestion": "string", "hotQuestion": "string" }
    }
  `;

  try {
    return await withRetry(async () => {
      const result = await getGenAI().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: `Generate a BRAND NEW AND UNIQUE SPM Speaking Task for Part ${part === 'Full' ? 1 : part}. ${theme ? `Focus on ${theme}.` : ''} Seed: ${seed}` }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const parsed = safeJsonParse(result.text || "{}");
      const requestedPart = part === 'Full' ? 1 : part;
      const normalized = normalizeSpeakingBankQuestion(parsed, requestedPart);
      if (!normalized || (requestedPart === 1 && (!Array.isArray(parsed.questions) || !parsed.questions.some((q: unknown) => typeof q === 'string' && q.trim())))) {
        throw new Error('The generated speaking task was incomplete.');
      }
      return { ...normalized, part: requestedPart };
    });
  } catch (e: any) {
    console.warn("Question generation unavailable; using sample practice questions:", e?.message || e);
    const randomSeed = Math.floor(Math.random() * 5);
    if (part === 1 || part === 'Full') {
      const topics = [
        { topic: "Future Ambitions", questions: ["What do you want to be when you grow up?", "Why did you choose that career?", "What subjects are important for your future?", "Do you want to work abroad?"] },
        { topic: "Local Traditions", questions: ["What festivals do you celebrate?", "What is a traditional food you like?", "How do you celebrate your birthday?", "Is it important to keep our culture?"] },
        { topic: "Health and Wellness", questions: ["Do you exercise regularly?", "What is your favorite sport?", "Is mental health important?", "What do you do to relax?"] },
        { topic: "Shopping and Fashion", questions: ["Do you like shopping for clothes?", "Where do you usually shop?", "Is fashion important to you?", "Do you prefer online shopping?"] },
        { topic: "Environment", questions: ["Do you recycle?", "Is your school green?", "How can we save water?", "Do you like nature?"] }
      ];
      return { part: 1, fallback: true, ...topics[randomSeed] };
    } else if (part === 2) {
      const topics = [
        { topic: "A memorable holiday", prompts: ["Where you went", "Who you went with", "What you did", "Why it was memorable"] },
        { topic: "Your favorite teacher", prompts: ["Who they are", "What they teach", "How they help you", "Why you like them"] },
        { topic: "An interesting book", prompts: ["What it is about", "When you read it", "Your favorite character", "Why you recommend it"] },
        { topic: "A local festival", prompts: ["What festival it is", "How it is celebrated", "What foods are served", "Why it is important"] },
        { topic: "A technology you use", prompts: ["What it is", "How it helps you", "How often you use it", "Why it is useful"] }
      ];
      const t = topics[randomSeed];
      return {
        part: 2,
        fallback: true,
        promptCard: {
          topic: t.topic,
          prompts: t.prompts,
          prepTip: "Focus on using adjectives and linking words."
        }
      };
    } else {
      return {
        part: 3,
        fallback: true,
        topic: "Random Topic",
        discussion: {
          situation: "Teenagers today are spending more time online. Why is this happening?",
          points: ["Social media", "Gaming", "School work", "Entertainment"],
          guides: ["Talk about connecting", "Mention esports", "Online research", "Streaming movies"],
          decisionQuestion: "Which is the main reason?",
          hotQuestion: "How can we balance online and offline life?"
        }
      };
    }
  }
}

export async function analyzeSPMSpeaking(
  part: number,
  task: SPMSpeakingTask,
  transcript: string,
  config?: NLPConfig
): Promise<any> {
  if (!transcript.trim() || !/\p{L}/u.test(transcript) || /^\s*\(?no response captured\)?\s*$/i.test(transcript)) {
    throw new Error('No answer was captured. Your answer was not scored. Please record or confirm your transcript.');
  }
  const model = resolveModel(config);
  
  const systemInstruction = `
    Role: You are a professional SPM English Speaking Test Examiner.
    Objective: Analyze this transcript of a student's performance in SPM Speaking Part ${part}.
    ${part === 1 ? 'PART 1 WARM-UP: This is a gentle personal conversation to build confidence before longer tasks. Focus on everyday Malaysian student life. Do not require critical thinking, debate, abstract ideas or sophisticated vocabulary. Accept short relevant natural answers. Start with encouragement grounded in what the learner actually said; suggest at most two simple improvements. Never invent praise or evidence.' : ''}
    ${config?.useDeepFeedback && part !== 1 ? "CRITICAL: Provide DEEP, DETAILED, AND HIGHLY ANALYTICAL feedback. Analyze specific linguistic patterns, grammar nuances, and sophisticated vocabulary usage. Be much more technical and comprehensive than a standard review." : ""}
    A transcript cannot establish pronunciation, accent, speaking pace, pauses, or vocal clarity. Do not claim to have measured those qualities.
    
    CRITICAL SCORING MANDATE:
    1. TRANSCRIPT VALIDITY: Assess the language actually provided in the context of this part. Do not impose a minimum word count or automatically give zero to a short relevant answer. If there is too little evidence for a criterion, state that limitation; do not invent performance evidence.
    2. IDENTITY CHECK: The transcript provided ONLY contains what the student said. Do NOT score based on your own generated questions. If the student repeats the question back without answering, score low (1-2). If they say nothing relevant, score 0.
    3. NO HALLUCINATION: Do not imagine that the student said something they didn't. If the transcript is "${transcript || 'EMPTY'}", and it's empty, they get 0.
    
    TRANSCRIPT FOR EVALUATION: "${transcript || 'EMPTY'}"
    
    TASK CONTEXT: ${JSON.stringify(task)}
    
    Give a transcript-based practice estimate informed by the SPM English Speaking assessment scales (0 to 6). It is not an official exam grade. The transcript cannot prove pace, spontaneity, pronunciation, or comprehension of spoken instructions, so explain this limit when discussing communicative or overall performance.
    
    CRITICAL LANGUAGE INSTRUCTION FOR L2 LEARNERS:
    - Write all feedback in clear, simple everyday English.
    - Explain any exam terms in plain English: "answering the question" (task fulfilment), "adding details and examples" (elaboration), "linking words" (cohesive devices), and "different sentence types" (sentence variety).
    
    SPM BANDSCALES (0-6) - DESCRIPTORS:
    1. Grammar (0-6):
       - 6: Shows high degree of control of simple and complex grammatical structures. Accuracy in use of linking words.
       - 3: Sufficient control of simple structures but lacks control of complex ones. Errors may occur.
       - 1: Very limited control. Severe errors even in simple structures.
    2. Vocabulary (0-6):
       - 6: Wide range of appropriate vocabulary for abstract and familiar topics. Precise meaning.
       - 3: Enough vocabulary for familiar topics but limited for abstract ones.
       - 1: Basic vocabulary. Often searches for words.
    3. Communicative Competence (0-6):
       - 6: Expresses spontaneously with little searching. Links sentences into clear speech.
       - 3: Some hesitation but can maintain conversation. Clear basic linking words.
       - 1: Long pauses. Needs significant prompting to maintain interaction.
    4. Overall Spoken Performance (0-6):
       - 6: Understands all instructions. Asks/responds with very little prompting.
       - 3: Understands generally. Responds appropriately with some prompting.
       - 1: Struggles to understand. Little response even with heavy prompting.

    Provide a clear, friendly summary and analysis in Markdown format. The output MUST be highly organized, visually structured, and concise.

    Include EXACTLY the following sections organized with clear headings and bullet points:
    - **📊 Bandscore Summary**: List the bands out of 6 for Grammar, Vocabulary, Communicative Competence, and Overall Spoken Performance. Total out of 24.
    - **⚖️ Strengths**: 2-3 actionable bullet points summarizing their strong points in simple English.
    - **🎯 Areas for Improvement**: 2-3 actionable bullet points summarizing what needs work based on the scales. Include specific examples from their transcript (e.g., "Instead of saying '...', try '...'").
    - Identify one short, exact quote from the student's transcript and give a more natural alternative they can practise on the same question. Never invent a quote.
    - **🗣️ Performance Analysis**: A brief, friendly analysis of their overall communication ability.
    ${config?.useDeepFeedback ? "- **🔬 Deep Learning Review**: Provide a detailed breakdown of sentence structure, grammatical variety, and word choice in plain English. Discuss only language patterns visible in the transcript; do not infer their accent or pronunciation. Link every tip to a specific quote from their transcript.\n- **📌 Linking Words Review**: Evaluate their use of transitions. Suggest 2-3 specific linking words they could have used in context.\n- **🚀 Advanced Vocabulary Upgrades**: Suggest 5-6 helpful words or phrases that would elevate their specific responses, citing their original word choices." : ""}
    ${config?.useDeepFeedback ? "- **🏆 Learning Rewards**: Assign XP (Experience Points) from 50-200 and Coins from 10-50 based on mastery. Suggest a creative 'Achievement Unlocked' badge name and a 'Shareable Snippet' for social media." : ""}
    
    Return ONLY valid JSON matching this exact structure:
    {
      "marks": {
        "grammar": 0,
        "vocabulary": 0,
        "communicativeCompetence": 0,
        "overallPerformance": 0,
        "total": 0
      },
      "metrics": {
        "grammar": 0,
        "vocabulary": 0,
        "competence": 0,
        "overall": 0
      },
      "userEvaluation": {
        "xp": 0,
        "coins": 0,
        "achievement": "string",
        "shareableSnippet": "string"
      },
      "score": 0,
      "strengths": ["Two short, specific strengths supported by the transcript"],
      "nextStep": {
        "quote": "Exact short quote copied from the transcript",
        "tryInstead": "A clear improved sentence the student could say instead",
        "practice": "One short instruction for the next attempt"
      },
      "feedback": "Markdown string (Make sure to escape newlines as \\n). Mention if the transcript was empty.",
      "transcript": "Cleaned up transcript or unchanged if already clean"
    }
  `;

  let result: any = {};
  try {
    result = await generateJSONWithAI(
      systemInstruction,
      `Transcript analysis for Part ${part}: "${transcript}"`,
      model,
      config
    );
    
    checkMarks(result, ['grammar', 'vocabulary', 'communicativeCompetence', 'overallPerformance'], 6);
    // Safety check: ensure score exists and is based on total
    if (result.marks) {
      if (typeof result.marks.total !== 'number') {
        result.marks.total = (result.marks.grammar || 0) + (result.marks.vocabulary || 0) + (result.marks.communicativeCompetence || 0) + (result.marks.overallPerformance || 0);
      }
      if (typeof result.score !== 'number') {
        result.score = Math.round((result.marks.total / 24) * 100);
      }
    }
    // Ensure metrics exist and have fallback values
    if (!result.metrics) {
      result.metrics = {};
    }
    result.metrics = {
      grammar: result.metrics.grammar || (result.marks?.grammar || 0) * 16.6,
      vocabulary: result.metrics.vocabulary || (result.marks?.vocabulary || 0) * 16.6,
      competence: result.metrics.competence || (result.marks?.communicativeCompetence || 0) * 16.6,
      overall: result.metrics.overall || (result.marks?.overallPerformance || 0) * 16.6
    };
  } catch (e: any) {
    throw e;
  }
  
  // Normalized metrics for the UI (0-100 scale)
  result.marks = result.marks || { grammar: 0, vocabulary: 0, communicativeCompetence: 0, overallPerformance: 0, total: 0 };
  result.metrics = {
    grammar: Math.round(((result.marks.grammar || 0) / 6) * 100),
    vocabulary: Math.round(((result.marks.vocabulary || 0) / 6) * 100),
    competence: Math.round(((result.marks.communicativeCompetence || 0) / 6) * 100),
    overall: Math.round(((result.marks.overallPerformance || 0) / 6) * 100)
  };
  
  result.score = Math.round((result.marks.total / 24) * 100);

  if (isNaN(result.score)) result.score = 0;
  // The learner-confirmed transcript is the audit record, never a model rewrite.
  result.transcript = transcript;
  return result;
}

export async function evaluateSpeechTranscript(transcript: string): Promise<any> {
  const model = "gemini-3.8-flash";
  
  const systemInstruction = `
    Role & Persona:
    Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert, professional examiner for the Malaysian SPM English Speaking assessment. Your job is to evaluate student speech transcripts for the "SpeakEZ" educational platform. Your target audience is 17-year-old students. Your tone must be encouraging, constructive, and mature. Do not use childish language, overly enthusiastic emojis, or patronizing praise.
    A transcript cannot establish pronunciation, accent, speaking pace, pauses, or vocal clarity. Do not claim to have measured those qualities.
    
    Objective:
    Analyze the provided speech transcript. Assign a band score for Grammar, Vocabulary, Communicative Competence, and Overall Spoken Performance based strictly on the official SPM assessment scales. Justify your scores with specific examples from the transcript and provide actionable, practical advice for improvement.

    Assessment Scales (Detailed Descriptors):
    Band 6: High accuracy in both simple and complex structures. Wide vocabulary for abstract topics. Spontaneous and coherent interaction.
    Band 5: Good accuracy. Wide vocabulary for familiar topics. Expresses with little hesitation and clear development.
    Band 4: Satisfactory control. Enough vocabulary for the task. Generally coherent with some effort.
    Band 3: Reasonable accuracy in simple structures. Vocabulary sufficient for everyday situations. Some hesitation but remains clear.
    Band 2: Limited control. Frequent errors in complex structures. Basic vocabulary. Often hesitant.
    Band 1: Only basic vocabulary and simple structures. Significant pauses and false starts. Meaning often obscured.
    Band 0: Not enough language to assess.

    Output Format:
    You must respond ONLY with a valid JSON object. Do not include markdown code blocks. Use the exact structure below:
    {
      "averageScore": 0,
      "grammar": {
        "score": 0,
        "feedback": "Brief, mature explanation",
        "quote": "Specific sentence from the transcript"
      },
      "vocabulary": {
        "score": 0,
        "feedback": "Brief, mature explanation",
        "quote": "Example of vocabulary usage"
      },
      "communicativeCompetence": {
        "score": 0,
        "feedback": "Brief, mature explanation"
      },
      "overallSpokenPerformance": {
        "score": 0,
        "feedback": "Brief, mature explanation"
      },
      "howToImprove": [
        "Actionable, practical tip 1",
        "Actionable, practical tip 2"
      ]
    }
  `;

  try {
    const parsedResult = await generateJSONWithAI(
      systemInstruction,
      `Transcript: "${transcript}"`,
      model
    );
    const areas = ['grammar','vocabulary','communicativeCompetence','overallSpokenPerformance'];
    if (!Array.isArray(parsedResult.howToImprove) || areas.some(key => !Number.isFinite(parsedResult[key]?.score) || parsedResult[key].score < 0 || parsedResult[key].score > 6 || typeof parsedResult[key].feedback !== 'string')) throw new Error('The AI feedback was incomplete. Your answer was not scored. Please try again.');
    parsedResult.averageScore = areas.reduce((sum, key) => sum + parsedResult[key].score, 0) / 4;
    for (const key of areas) {
      if (parsedResult[key].quote && !transcript.includes(parsedResult[key].quote)) parsedResult[key].quote = '';
    }
    return parsedResult;
  } catch (e: any) {
    throw e;
  }
}

export async function generateSocialSnippet(achievementTitle: string, achievementDesc: string): Promise<string> {
  const prompt = `
    Use short sentences and everyday English in all student feedback. Explain any necessary exam term in simple words. You are an expert social media manager.
    Generate a short, catchy, and hype social media caption (Instagram/TikTok/X style) for a student who just unlocked an achievement in an English learning app called "EZ Academy".
    
    Achievement Title: "${achievementTitle}"
    Achievement Description: "${achievementDesc}"
    
    Guidelines:
    - Make it sound exciting and flex-worthy.
    - Keep it under 280 characters.
    - Include modern emojis.
    - MUST explicitly mention "EZ Academy" or "ezacademy.my" to promote the app.
    - Include standard hashtags like #EZAcademy #EnglishLearning #AchievementUnlocked.
    - Do not wrap in quotes. Just the text.
  `;

  const sdkResponse = await withRetry(async () => {
    return await getGenAI().models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
         temperature: 0.7,
      }
    });
  });

  return sdkResponse.text || "I just leveled up my English skills on EZ Academy! 🚀 #EZAcademy";
}
