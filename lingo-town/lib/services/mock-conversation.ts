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
};
