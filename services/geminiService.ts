
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Summary } from '../types';

const SYSTEM_INSTRUCTION = `
あなたは、コールセンターの通話記録を要約するプロフェッショナルです。以下のルールに従って、提供されたテキストを再構成・要約してください。

【要件】
1. 発言者を明確にし、「☆」はお客様、「★」はオペレーターとして会話形式にしてください。
2. 話し言葉や曖昧な表現は、自然で読みやすく整えてください。
3. 不要な挨拶や冗長なやり取りは省略し、実務上重要な発言のみを残してください。
4. 謝罪や案内などの重要表現は省略せず、丁寧に記載してください。
5. 通話の意図、問題点、対応内容、今後のアクションを明確にしてください。
6. 必要に応じて、フォローアップすべきタスクやCRM入力項目を整理してください。
7. 商品名が不明確な場合、以下のいずれかに修正してください: 'トーチラック', 'ピーチラック', '日本山人参', 'EGライフ'。

【出力形式】
必ず指定されたJSON形式で出力してください。
`;

const AUDIO_SYSTEM_INSTRUCTION = `
あなたは、コールセンターの通話記録を処理するプロフェッショナルです。
提供された音声ファイルをまず文字に起こしてください。
その後、その文字起こし内容をもとに、以下のルールに従って会話を再構成・要約してください。

【要件】
1. 発言者を明確にし、「☆」はお客様、「★」はオペレーターとして会話形式にしてください。
2. 話し言葉や曖昧な表現は、自然で読みやすく整えてください。
3. 不要な挨拶や冗長なやり取りは省略し、実務上重要な発言のみを残してください。
4. 謝罪や案内などの重要表現は省略せず、丁寧に記載してください。
5. 通話の意図、問題点、対応内容、今後のアクションを明確にしてください。
6. 必要に応じて、フォローアップすべきタスクやCRM入力項目を整理してください。
7. 商品名が不明確な場合、以下のいずれかに修正してください: 'トーチラック', 'ピーチラック', '日本山人参', 'EGライフ'。

【出力形式】
必ず指定されたJSON形式で出力してください。
`;


const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reconstructedConversation: {
      type: Type.ARRAY,
      description: "再構成された会話。☆はお客様、★はオペレーター。",
      items: {
        type: Type.OBJECT,
        required: ["speaker", "line"],
        properties: {
          speaker: { type: Type.STRING, enum: ["☆", "★"], description: "発言者 (☆ お客様, ★ オペレーター)" },
          line: { type: Type.STRING, description: "発言内容" },
        },
      },
    },
    summary: {
      type: Type.OBJECT,
      description: "要点整理",
      required: ["purpose", "customerRequest", "operatorResponse", "nextSteps"],
      properties: {
        purpose: { type: Type.STRING, description: "通話の目的" },
        customerRequest: { type: Type.STRING, description: "お客様の主な要望・懸念" },
        operatorResponse: { type: Type.STRING, description: "オペレーターの対応内容" },
        nextSteps: { type: Type.STRING, description: "今後の対応／タスク" },
      },
    },
    crmInput: {
      type: Type.STRING,
      description: "CRMへの入力項目。必要ない場合は空欄。",
    },
  },
  required: ["reconstructedConversation", "summary", "crmInput"],
};

export const summarizeCall = async (apiKey: string, transcript: string): Promise<Summary> => {
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: transcript,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
        }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    return parsedJson as Summary;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get summary from Gemini API.");
  }
};

export const transcribeAndSummarizeAudio = async (apiKey: string, base64Audio: string, mimeType: string): Promise<Summary> => {
  if (!mimeType.startsWith('audio/')) {
    console.error("Invalid MIME type provided:", mimeType);
    throw new Error('無効な音声ファイル形式です。');
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const audioPart = {
      inlineData: {
        data: base64Audio,
        mimeType: mimeType,
      },
    };
    
    const textPart = {
        text: "この音声ファイルを文字起こしし、指定された形式で要約してください。"
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [audioPart, textPart] },
        config: {
            systemInstruction: AUDIO_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
        }
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("APIからの応答が空でした。音声が短いか、認識できない可能性があります。");
    }
    const parsedJson = JSON.parse(jsonText);
    return parsedJson as Summary;
  } catch (error) {
    console.error("Error calling Gemini API with audio:", error);
    if (error instanceof SyntaxError) {
        throw new Error("APIから無効なJSON応答がありました。");
    }
    throw new Error("Gemini APIによる音声の要約に失敗しました。");
  }
};