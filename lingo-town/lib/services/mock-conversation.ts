import type { Correction, RecastRule } from "@/data/types";
import type { CharacterLine, ConversationService } from "./types";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Builds a reply line and the highlight range from a `{recast}` template. */
export function fillTemplate(template: string, recast: string): CharacterLine {
  const start = template.indexOf("{recast}");
  if (start < 0) return { text: template };
  // Capitalise when the recast opens the sentence.
  const shown = start === 0 ? recast.charAt(0).toUpperCase() + recast.slice(1) : recast;
  return {
    text: template.replace("{recast}", shown),
    highlights: [{ start, end: start + shown.length }],
  };
}

function findRecast(rules: RecastRule[], learnerText: string) {
  for (const rule of rules) {
    const re = new RegExp(rule.pattern, "i");
    const m = learnerText.match(re);
    if (m) return { rule, re };
  }
  return null;
}

function betterVersion(said: string, rule: RecastRule, re: RegExp) {
  let out = said.replace(re, rule.better).trim();
  out = out.charAt(0).toUpperCase() + out.slice(1);
  if (!/please/i.test(out) && /[.]$/.test(out)) out = out.replace(/\.$/, ", please.");
  return out;
}

/**
 * Scripted conversation: walks the scene's dialogue steps and recasts
 * known learner errors. A real LLM implementation keeps this contract.
 */
export const mockConversation: ConversationService = {
  async getCharacterReply({ scene, learnerText, stepIndex }) {
    await wait(400);
    const step = scene.dialogue[stepIndex];
    const lines: CharacterLine[] = [];

    // The rescue phrase never costs progress: repeat the question, simpler.
    const norm = (t: string) => t.toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (step && norm(learnerText) === norm(scene.rescuePhrase.text)) {
      return {
        lines: [{ text: "Of course, no problem." }, { text: step.prompt }],
        nextStepIndex: stepIndex,
        done: false,
      };
    }
    let correction: Correction | undefined;

    const hit = findRecast(scene.recasts, learnerText);
    if (hit) {
      lines.push(fillTemplate(hit.rule.replyTemplate, hit.rule.recast));
      correction = {
        said: learnerText,
        better: betterVersion(learnerText, hit.rule, hit.re),
        explanationAr: hit.rule.explanationAr,
        ruleId: hit.rule.id,
      };
    } else if (step) {
      lines.push({ text: step.reply });
    }

    const nextStepIndex = stepIndex + 1;
    const next = scene.dialogue[nextStepIndex];
    if (next) lines.push({ text: next.prompt });
    else lines.push({ text: scene.closing });

    return { lines, correction, nextStepIndex, done: !next };
  },

  async summarizeSession(scene, history) {
    const learner = history.filter((m) => m.from === "learner");
    const corrections = learner.map((m) => m.correction).filter((c): c is Correction => !!c);
    const all = learner.map((m) => m.text.toLowerCase()).join(" ");
    const goalMet = learner.length >= scene.dialogue.length;

    const wentWell: string[] = [];
    if (goalMet) wentWell.push(`You reached your goal: ${scene.goal.charAt(0).toLowerCase()}${scene.goal.slice(1)}`);
    if (/please/.test(all)) wentWell.push("You said “please” naturally, which sounds warm and polite");
    if (/thanks|thank you/.test(all)) wentWell.push("You closed the conversation politely");
    if (learner.every((m) => !/[\u0600-\u06FF]/.test(m.text))) wentWell.push("You stayed in English the whole time");
    if (wentWell.length < 2) wentWell.push("You kept the conversation going. That's the hardest part");

    return {
      sceneId: scene.id,
      goalMet,
      turns: learner.length,
      wentWell: wentWell.slice(0, 3),
      focus: corrections[0],
      phrasesAdded: [...scene.keyPhrases.slice(0, 2), scene.rescuePhrase],
    };
  },
};
