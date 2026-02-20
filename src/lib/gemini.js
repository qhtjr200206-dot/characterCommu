import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key_for_build");

/**
 * Gemini로 텍스트를 생성합니다.
 * @param {string} prompt - AI에게 보낼 프롬프트
 * @param {object} options - 옵션 (model, temperature 등)
 * @returns {Promise<string>} 생성된 텍스트
 */
export async function generateText(prompt, options = {}) {
    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "dummy_key_for_build") {
            throw new Error("GEMINI_API_KEY가 설정되지 않았습니다. .env 파일에 API 키를 입력해 주세요.");
        }

        const modelName = options.model || "gemini-2.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: options.temperature ?? 0.8,
                maxOutputTokens: options.maxTokens ?? 8192,
                responseMimeType: options.responseMimeType || "text/plain", // 기본값은 평문
            },
        });

        const response = await result.response;

        // 디버깅을 위해 결과 구조 확인
        if (!response.candidates || response.candidates.length === 0) {
            console.error("Gemini 응답에 후보(candidates)가 없습니다:", JSON.stringify(response));
            throw new Error("Gemini가 응답을 생성하지 못했습니다. (Safety Filter 차단 가능성)");
        }

        const text = response.text();

        if (!text) {
            console.error("Gemini 응답 텍스트가 비어있습니다. 응답 객체:", JSON.stringify(response));
            throw new Error("Gemini로부터 빈 응답을 받았습니다.");
        }

        return text;
    } catch (error) {
        console.error("Gemini API 호출 상세 에러:", error);
        if (error.message?.includes("API key not valid")) {
            throw new Error("Gemini API 키가 유효하지 않습니다. .env 파일의 API 키를 확인해 주세요.");
        }
        throw error;
    }
}

/**
 * 캐릭터 세부 설정 기반 대사를 생성합니다.
 */
export async function generateDialogue(character, situation) {
    const prompt = `당신은 다음 캐릭터로서 대사를 생성해야 합니다.

캐릭터 정보:
- 이름: ${character.name}
- 나이: ${character.age || "불명"}
- 소속: ${character.affiliation || "없음"}
- 성격: ${character.personality || "미설정"}
- 외모: ${character.appearance || "미설정"}
- 배경: ${character.background || "미설정"}

상황: ${situation}

위 캐릭터의 성격과 배경을 반영하여, 이 상황에서의 자연스러운 대사를 3~5줄로 생성해 주세요. 
대사만 출력하고, 설명은 포함하지 마세요.`;

    return generateText(prompt, { temperature: 0.9 });
}

/**
 * 두 캐릭터 간의 관계 대사를 생성합니다.
 */
export async function generateRelationDialogue(char1, char2, relationType, situation) {
    const prompt = `두 캐릭터의 대화를 생성해 주세요.

캐릭터 1:
- 이름: ${char1.name}
- 성격: ${char1.personality || "미설정"}
- 배경: ${char1.background || "미설정"}

캐릭터 2:
- 이름: ${char2.name}
- 성격: ${char2.personality || "미설정"}
- 배경: ${char2.background || "미설정"}

두 캐릭터의 관계: ${relationType}
상황: ${situation}

각 캐릭터의 성격과 관계를 반영한 자연스러운 대화를 5~10줄로 생성해 주세요.
형식: "캐릭터명: 대사" 로 작성하세요.`;

    return generateText(prompt, { temperature: 0.9 });
}

/**
 * 조사 스크립트를 생성합니다.
 */
export async function generateInvestigationScript(investigation) {
    const pointsDesc = investigation.points
        .map((p, i) => `  ${i + 1}. ${p.name}: ${p.description} (난이도: ${p.difficulty})`)
        .join("\n");

    const itemsDesc = investigation.items
        .map((item, i) => `  ${i + 1}. ${item.name}: ${item.description}${item.condition ? ` (획득 조건: ${item.condition})` : ""}`)
        .join("\n");

    const prompt = `당신은 TRPG 게임 마스터입니다. 아래 설정에 따라 1~2시간 분량의 조사 스크립트를 JSON 형식으로 생성해 주세요.

조사 제목: ${investigation.title}
조사 유형: ${investigation.type === "SOLO" ? "1인 조사" : "다인 조사"}

조사 포인트:
${pointsDesc}

중요 물품:
${itemsDesc}

다음 JSON 형식으로 스크립트를 생성하세요 (마크다운 코드 블록 없이 순수 JSON만 출력 선호):
{
  "scenes": [
    {
      "id": 1,
      "title": "장면 제목",
      "narration": "장면 설명/내레이션 텍스트",
      "dialogues": [
        { "speaker": "NPC이름 또는 시스템", "text": "대사 내용" }
      ],
      "choices": [
        {
          "text": "선택지 1",
          "nextScene": 2,
          "reaction": "이 선택을 했을 때 시스템/NPC가 보일 짧은 즉각적 반응",
          "effect": "결과(상태 변화 등) 설명"
        },
        {
          "text": "선택지 2",
          "nextScene": 3,
          "reaction": "반응 2",
          "effect": "결과 2"
        },
        {
          "text": "선택지 3",
          "nextScene": 4,
          "reaction": "반응 3",
          "effect": "결과 3"
        }
      ],
      "items": ["획득 가능한 물품 이름"]
    }
  ]
}

최대한 긴박하고 몰입감 있는 시나리오로 작성해 주세요. 
- 반드시 각 장면마다 최소 3개 이상의 의미 있는 선택지를 포함하세요.
- 각 선택지에는 해당 행동 직후의 'reaction'(반응) 필드를 추가하여 플레이어의 행동에 실시간으로 반응하는 느낌을 주세요.
- 선택지에 따라 시나리오가 분기되도록 설계하세요 (최소 7개 이상의 장면). 
- 응답이 잘리지 않도록 내레이션과 대사는 핵심 위주로 작성하세요.
- 반드시 유효한 JSON만 출력하세요.`;

    const text = await generateText(prompt, {
        model: "gemini-2.5-flash",
        temperature: 0.7,
        maxTokens: 8192,
        responseMimeType: "application/json"
    });

    try {
        // 1. 기본 파싱 시도
        return JSON.parse(text.trim());
    } catch (e) {
        console.error("=== [DEBUG] AI JSON 파싱 실패 ===");

        // 2. 텍스트 내에서 JSON 블록만 추출해서 재시도 (중간에 잘렸거나 앞뒤에 설명이 붙은 경우 대비)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (innerE) {
                console.error("추출된 JSON 블록도 파싱에 실패했습니다.");
            }
        }

        console.error("AI 원본 응답:", text);
        const preview = text ? text.substring(0, 150) + "..." : "응답 없음";
        throw new Error(`AI 응답이 중간에 끊겼거나 형식이 맞지 않습니다. (내용: ${preview})`);
    }
}

export default genAI;
