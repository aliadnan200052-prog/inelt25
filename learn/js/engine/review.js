// ════════════════════════════════════════════════════════════
// Review sessions: turn due item states into retrieval tasks,
// each in a context (sentence) the learner has not answered yet.
// ════════════════════════════════════════════════════════════
import { dueQueue, nextTask, pickContext, grade } from './srs.js';
import { makeCloze, firstLetterHint, shuffle } from './text.js';
import { checkExercise, qualityFrom } from './feedback.js';

/** Build the exercise for one item + task type. */
export function buildTask(item, state, allItems, { rand = Math.random, task } = {}) {
  let type = task || nextTask(state);
  const ctx = pickContext(item.contexts, state, rand);

  if (type === 'recognition') {
    const distractors = shuffle(
      allItems.filter(o => o.id !== item.id && o.kind === item.kind && o.meaning && o.meaning !== item.meaning),
      rand,
    ).slice(0, 3).map(o => o.meaning);
    if (distractors.length >= 2) {
      const options = shuffle([item.meaning, ...distractors], rand);
      return {
        itemId: item.id, task: 'recognition', contextId: ctx?.id || null,
        exercise: {
          id: `rv-${item.id}-rec`, type: 'mcq', skill: skillOf(item), items: [item.id],
          prompt: `What does “${item.form}” mean here?`,
          sentence: ctx?.sentence || item.example,
          options, answer: options.indexOf(item.meaning),
        },
      };
    }
    type = 'recall';
  }

  if (type === 'recall') {
    if (ctx) {
      const c = makeCloze(ctx.sentence, ctx.cloze);
      if (c.found) {
        return {
          itemId: item.id, task: 'recall', contextId: ctx.id,
          exercise: {
            id: `rv-${item.id}-${ctx.id}`, type: 'gap', skill: skillOf(item), items: [item.id],
            prompt: item.kind === 'grammar' ? `Complete the sentence (${item.form}).` : 'Complete the sentence.',
            clue: item.meaning,
            text: `${c.before}___${c.after}`,
            answers: [c.answer, ...(ctx.accept || [])],
            hint: firstLetterHint(c.answer),
          },
        };
      }
    }
    return {
      itemId: item.id, task: 'recall', contextId: null,
      exercise: {
        id: `rv-${item.id}-form`, type: 'recall', skill: skillOf(item), items: [item.id],
        prompt: `Which ${item.kind === 'word' ? 'word' : 'expression'} means: “${item.meaning}”?`,
        answers: [item.form, ...(item.accept || [])],
        hint: firstLetterHint(item.form),
      },
    };
  }

  // production
  return {
    itemId: item.id, task: 'production', contextId: `own-${item.id}`,
    exercise: {
      id: `rv-${item.id}-own`, type: 'produce', skill: skillOf(item), items: [item.id],
      prompt: item.produce || `Use “${item.form}” in a sentence of your own.`,
      target: item.match && item.match.length ? item.match : [escapeRe(item.form)],
      targetLabel: item.form,
      sample: item.example,
      minWords: 4,
    },
  };
}

/**
 * A review session: due items (plus admin-forced ones), one task each.
 * `forced` are item ids an admin review schedule made due today.
 */
export function buildSession(itemsById, states, now, { limit = 15, forced = [], rand = Math.random } = {}) {
  const all = Object.values(itemsById);
  const queue = dueQueue(states.filter(s => itemsById[s.itemId]), now, { limit, forced });
  return queue.map(s => buildTask(itemsById[s.itemId], s, all, { rand }));
}

/** Check a review answer and return the new item state. */
export function answerTask(task, state, response, now, { hintUsed = false, selfConfirmed = true } = {}) {
  const check = checkExercise(task.exercise, response);
  let quality = qualityFrom(check, { hintUsed });
  // Own sentences: the learner confirms the meaning is what they intended.
  if (task.task === 'production' && check.correct && !selfConfirmed) quality = 'hard';
  const next = grade(state, { quality, task: task.task, contextId: quality === 'again' ? null : task.contextId }, now);
  return { check, quality, state: next };
}

export function skillOf(item) {
  return item.kind === 'grammar' ? 'grammar' : 'vocabulary';
}

function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
