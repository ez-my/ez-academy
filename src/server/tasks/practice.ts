import { normalizeReadTest } from '../../lib/readTestCompatibility';
import { generateJSONWithAI } from './spm';
import { ListenQuestion } from "../../types";
import { withRetry } from "../retry";
import { getGenAI, Modality } from "../providerContext";

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

async function createListeningQuestions(parts: any[]) {
    const model = "gemini-3.8-flash";
    
    const systemInstruction = `
      You are an expert ESOL examiner creating SPM (Malaysian secondary school) format English listening questions.
      Your task is to analyze the provided audio and generate a set of questions.
      
      Output exactly in JSON format matching this schema:
      {
        "transcript": "Full transcript of the audio",
        "questions": [
          {
            "id": "q1",
            "part": 1,
            "type": "MCQ",
            "text": "The question text",
            "options": ["Option A", "Option B", "Option C"]
          }
        ],
        "answers": {
          "q1": "A"
        }
      }
      
      Guidelines:
      1. Create 5-8 questions for a typical audio clip.
      2. If the audio is long, focus on the most important parts.
      3. For MCQ, always provide 3 options (SPM Part 1/2 style).
      4. Use Part 1 for short clips, Part 2 for longer ones.
      5. Ensure the answers are accurate based on the transcript.
    `;

    const result = await withRetry(async () => {
      const result = await getGenAI().models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts,
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });
      return result;
    });

    const parsed = safeJsonParse(result.text || "{}");
    return parsed;
}

export class GeminiService {
  /**
   * Generates listening questions based on an audio file.
   */
  static async generateQuestionsFromAudio(audioBase64: string, mimeType: string) {
    return createListeningQuestions([{ text: 'Generate listening questions based on this audio clip.' }, { inlineData: { data: audioBase64, mimeType } }]);
  }

  static async generateQuestionsFromTranscript(transcript: string) {
    return createListeningQuestions([{ text: 'Generate listening questions based on this audio transcript. Preserve its words as the transcript field.\n' + transcript }]);
  }

  /**
   * Translates a word or phrase with contextual definition.
   */
  static async translateWithDefinition(text: string, context?: string): Promise<{
    translation: string;
    definition: string;
    example: string;
    phonetic?: string;
  }> {
    const model = "gemini-3.8-flash";
    
    const systemInstruction = `
      You are a specialized ESOL translator for Malaysian English learners.
      Translate the given word or phrase into Bahasa Melayu and provide a simple English definition and example sentence.
      
      Output exactly in JSON format:
      {
        "translation": "Bahasa Melayu translation",
        "definition": "Simple English definition",
        "example": "Example sentence using the word",
        "phonetic": "Phonetic spelling (optional)"
      }
    `;

    const result = await withRetry(async () => {
      const result = await getGenAI().models.generateContent({
        model,
        contents: [{
          role: "user",
          parts: [{ text: `Translate: "${text}" ${context ? `\nContext: ${context}` : ''}` }]
        }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });
      return result;
    });

    return safeJsonParse(result.text || "{}");
  }

  /**
   * Generates natural speech from text using Gemini TTS.
   */
  static async generateSpeech(text: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | 'Aoede' | 'Icarus' | 'Leda' = 'Aoede'): Promise<{ data: string; mimeType: string }> {
    const result = await withRetry(async () => {
      const result = await getGenAI().models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName
              }
            }
          }
        }
      });
      return result;
    });

    const part = result.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64Audio = part?.data;
    const mimeType = part?.mimeType || 'audio/wav';
    
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini TTS");
    }
    return { data: base64Audio, mimeType };
  }

  static async generateReadTest(topic: string = "General Knowledge", mode: 'FULL' | 1 | 2 | 3 | 4 | 5 = 'FULL'): Promise<any> {
    const model = "gemini-3.8-flash"; 
    
    let structureRequirements = "";
    let outputSchema = "";

    if (mode === 'FULL') {
      structureRequirements = `
      Part 1 (Questions 1–8): Short Texts. 8 distinct short stimuli (emails, notices, short articles). MCQs with 3 options (A, B, C).
      Part 2 (Questions 9–18): Cloze Text. A 150-word passage with 10 numbered blanks inside it (represented as ___9___, ___10___ etc). MCQs with 4 options (A, B, C, D) per blank.
      Part 3 (Questions 19–26): Reading Comprehension. Narrative or expository passage (approx 400 words). 8 MCQs with 4 options (A, B, C, D).
      Part 4 (Questions 27–32): Gapped Text. Article with 6 removed sentences (represented as ___27___, ___28___ etc). Provide 8 sentence options (A–H) where 2 are distractors.
      Part 5 (Questions 33–40): Matching & Info Transfer. 6 short descriptive paragraphs (A–F). 
      - Q33-36: 4 matching statements.
      - Q37-40: A summary paragraph with 4 blanks requiring one-word answers from the text.`;
      
      outputSchema = `
      {
        "id": "generated_test_1",
        "title": "SPM 1119/1 Reading Practice - ${topic}",
        "parts": [
          { "partNumber": 1, ... },
          { "partNumber": 2, ... },
          { "partNumber": 3, ... },
          { "partNumber": 4, ... },
          { "partNumber": 5, ... }
        ],
        "answers": { "1": "A", "9": "B", "27": "D" }
      }`;
    } else {
      if (mode === 1) {
        structureRequirements = `Part 1 (Questions 1–8): Short Texts. 8 distinct short stimuli (emails, notices, short articles). MCQs with 3 options (A, B, C).`;
      } else if (mode === 2) {
        structureRequirements = `Part 2 (Questions 9–18): Cloze Text. A 150-word passage with 10 numbered blanks inside it (represented as ___9___, ___10___ etc). MCQs with 4 options (A, B, C, D) per blank.`;
      } else if (mode === 3) {
        structureRequirements = `Part 3 (Questions 19–26): Reading Comprehension. Narrative or expository passage (approx 400 words). 8 MCQs with 4 options (A, B, C, D).`;
      } else if (mode === 4) {
        structureRequirements = `Part 4 (Questions 27–32): Gapped Text. Article with 6 removed sentences (represented as ___27___, ___28___ etc). Provide 8 sentence options (A–H) where 2 are distractors.`;
      } else if (mode === 5) {
        structureRequirements = `Part 5 (Questions 33–40): Matching & Info Transfer. 6 short descriptive paragraphs (A–F). 
      - Q33-36: 4 matching statements.
      - Q37-40: A summary paragraph with 4 blanks requiring one-word answers from the text.`;
      }
      
      outputSchema = `
      {
        "id": "generated_test_1",
        "title": "SPM 1119/1 Reading Practice (Part ${mode}) - ${topic}",
        "parts": [
          {
             "partNumber": ${mode},
             "instruction": "Follow the part specific instructions",
             "passage": "Passage text...",
             "stimuli": [],
             "questions": []
          }
        ],
        "answers": { "1": "A" }
      }`;
    }

    const systemInstruction = `
      You are an expert English language test developer specializing in the Malaysian SPM (Sijil Pelajaran Malaysia) curriculum. Your task is to generate high-quality reading comprehension items that strictly follow the SPM 1119/1 format.

      Topic Theme: ${topic}

      General Guidelines:
      1. Tone should be formal yet accessible.
      2. Maintain a consistent difficulty level (upper-intermediate, CEFR B2 level).
      3. The response MUST strictly adhere to the JSON format. No extra markdown fences around the JSON object.

      Structure requirements:
      ${structureRequirements}

      Output JSON strictly matching this schema:
      ${outputSchema}
      Expand every placeholder into complete content. Return exactly one parts entry for each requested part, containing both its passage/stimuli and all its questions. Never return empty questions or separate content-only parts.
      Each question MUST use these exact UI fields: {"id":"q1","number":1,"type":"MCQ","text":"Question text","options":["A. First choice","B. Second choice","C. Third choice"],"stimulusId":"s1"}.
      For Part 1, each of the 8 stimuli MUST have {"id":"s1","title":"Notice","content":"Complete short text"}; its corresponding question uses stimulusId.
      For Part 4 use type GAPPED_TEXT and string options A through H on each question.
      For Part 5 matching questions use type MATCHING and string options A through F; one-word questions use SHORT_ANSWER and omit options.
      answers MUST map each exact question id to its correct letter or one-word answer, for example {"q1":"A"}. Question numbers follow the specified part ranges. Include every answer.
      The title must contain the actual theme and part, never literal template placeholders.
    `;

    const result = await withRetry(async () => {
      const result = await getGenAI().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: "Generate the test now according to instructions." }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });
      return result;
    });

    try {
      const text = result.text;
      const test = normalizeReadTest(safeJsonParse(text || "{}"), mode, true);
      if (!test) throw new Error("Incomplete reading test structure");
      return test;
    } catch (parseError: any) {
      console.warn("Reading generation returned an incompatible structure");
      throw new Error(`Failed to generate valid JSON practice test: ${parseError.message}. This usually happens if the generated content is too large. Try generating a single Part instead of a FULL test.`);
    }
  }

  static async generateStudyRecommendation(userData: {
    name: string;
    level: string;
    goal: string;
    scores: Record<string, number>;
    metrics: Record<string, number>;
    recentSessions: any[];
  }): Promise<{
    analysis: string;
    recommendations: {
      title: string;
      desc: string;
      type: 'SpeakEZ' | 'WriteEZ' | 'ReadEZ' | 'ListenEZ';
    }[];
  }> {
    const model = "gemini-3.8-flash";
    
    const systemInstruction = `
      You are an expert ESOL dynamic study advisor for Malaysian students.
      Analyze the student's performance data and suggest a short, useful study plan.
      Explain what to practise next in simple English.
      
      Student Name: ${userData.name}
      Goal: ${userData.goal}
      Level: ${userData.level}
      
      PERFORMANCE DATA:
      - Scores: ${JSON.stringify(userData.scores)}
      - Sub-metrics: ${JSON.stringify(userData.metrics)}
      
      OUTPUT FORMAT (JSON):
      {
        "analysis": "A short explanation of their progress, using everyday English (up to 40 words).",
        "recommendations": [
          {
            "title": "Specific Task Name",
            "desc": "A one-sentence instruction on what to focus on during this task.",
            "type": "Specific Module"
          }
        ]
      }
      
      Provide 3-4 specific recommendations.
    `;

    return generateJSONWithAI(systemInstruction, 'Suggest a study plan based on these results.');
  }
}
