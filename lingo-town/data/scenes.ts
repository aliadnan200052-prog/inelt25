import type { Scene } from "./types";

export const scenes: Scene[] = [
  {
    id: "cafe-order",
    placeId: "cafe",
    characterId: "maya",
    title: "Ordering a coffee",
    titleAr: "طلب قهوة",
    goal: "Order a drink, choose a size, and pay.",
    goalAr: "اطلب مشروباً، اختر الحجم، وادفع.",
    successTitle: "You got your coffee",
    level: "A2",
    minutes: 6,
    media: {
      durationSec: 42,
      transcript: [
        { speaker: "character", text: "Morning! What can I get for you?" },
        { speaker: "other", name: "Customer", text: "Hi. Could I have a latte, please?" },
        { speaker: "character", text: "Sure. What size would you like?" },
        { speaker: "other", name: "Customer", text: "A medium, please. To take away." },
        { speaker: "character", text: "That's four fifty. Anything else?" },
        { speaker: "other", name: "Customer", text: "No, that's all, thanks." },
      ],
    },
    keyPhrases: [
      {
        id: "cafe-could-i-have",
        text: "Could I have a latte, please?",
        meaningAr: "هل يمكنني الحصول على لاتيه، من فضلك؟",
        note: "The polite way to order",
        placeId: "cafe",
      },
      {
        id: "cafe-what-size",
        text: "What size would you like?",
        meaningAr: "أي حجم تريد؟",
        note: "You'll hear this a lot",
        placeId: "cafe",
      },
      {
        id: "cafe-take-away",
        text: "To take away, please.",
        meaningAr: "للأخذ معي، من فضلك.",
        note: "Or: “For here, please.”",
        placeId: "cafe",
      },
      {
        id: "cafe-thats-all",
        text: "No, that's all, thanks.",
        meaningAr: "لا، هذا كل شيء، شكراً.",
        placeId: "cafe",
      },
    ],
    rescuePhrase: {
      id: "cafe-say-again",
      text: "Sorry, could you say that again?",
      meaningAr: "عذراً، هل يمكنك أن تعيد ذلك؟",
      note: "Use it any time you get lost",
      placeId: "cafe",
    },
    dialogue: [
      {
        id: "order",
        prompt: "Morning! Welcome in. What can I get for you?",
        hint: { text: "Could I have a latte, please?", meaningAr: "هل يمكنني الحصول على لاتيه، من فضلك؟" },
        sampleAnswer: "I want a latte.",
        reply: "Lovely, one latte coming up.",
      },
      {
        id: "size",
        prompt: "What size would you like? Small, medium or large?",
        hint: { text: "A medium, please.", meaningAr: "حجم وسط، من فضلك." },
        sampleAnswer: "Medium, please.",
        reply: "Medium it is.",
      },
      {
        id: "here-or-away",
        prompt: "Is that for here, or to take away?",
        hint: { text: "To take away, please.", meaningAr: "للأخذ معي، من فضلك." },
        sampleAnswer: "To take away, please.",
        reply: "Perfect, I'll pop a lid on it.",
      },
      {
        id: "pay",
        prompt: "That's four pounds fifty. Anything else for you?",
        hint: { text: "No, that's all, thanks.", meaningAr: "لا، هذا كل شيء، شكراً." },
        sampleAnswer: "No, that's all, thanks.",
        reply: "Great. Tap your card whenever you're ready.",
      },
    ],
    recasts: [
      {
        id: "i-want",
        pattern: "\\bi want\\b",
        better: "I'd like",
        recast: "you'd like a latte",
        replyTemplate: "Lovely, so {recast}. Coming right up.",
        explanationAr: "«I want» تبدو مباشرة جداً عند الطلب. «I'd like» أو «Could I have» أكثر لطفاً وطبيعية.",
      },
      {
        id: "give-me",
        pattern: "\\bgive me\\b",
        better: "Could I get",
        recast: "you'd like a latte",
        replyTemplate: "Sure, {recast}? No problem at all.",
        explanationAr: "«Give me» تبدو كأمر. استخدم «Could I get» لتبدو مهذباً.",
      },
      {
        id: "how-much-it-is",
        pattern: "\\bhow much (it|this) (costs?|is)\\b",
        better: "How much is it",
        recast: "How much is it",
        replyTemplate: "{recast}? It's four pounds fifty.",
        explanationAr: "في السؤال نقدّم الفعل: «How much is it?» وليس «How much it is?».",
      },
    ],
    closing: "Here you go, one medium latte. Have a lovely day!",
  },
  {
    id: "bakery-bread",
    placeId: "bakery",
    characterId: "ben",
    title: "Buying fresh bread",
    titleAr: "شراء خبز طازج",
    goal: "Ask what's fresh and buy a loaf.",
    goalAr: "اسأل عن الخبز الطازج واشترِ رغيفاً.",
    successTitle: "Warm bread, in hand",
    level: "A2",
    minutes: 5,
    media: {
      durationSec: 36,
      transcript: [
        { speaker: "character", text: "Hello! Everything on the left came out of the oven an hour ago." },
        { speaker: "other", name: "Customer", text: "Great. Which one do you recommend?" },
        { speaker: "character", text: "The sourdough, definitely." },
        { speaker: "other", name: "Customer", text: "I'll take one, please. Could you slice it?" },
      ],
    },
    keyPhrases: [
      {
        id: "bakery-recommend",
        text: "Which one do you recommend?",
        meaningAr: "أيّها تنصح به؟",
        placeId: "bakery",
      },
      { id: "bakery-ill-take", text: "I'll take one, please.", meaningAr: "سآخذ واحداً، من فضلك.", placeId: "bakery" },
      {
        id: "bakery-slice",
        text: "Could you slice it for me?",
        meaningAr: "هل يمكنك تقطيعه لي؟",
        placeId: "bakery",
      },
    ],
    rescuePhrase: {
      id: "bakery-slowly",
      text: "Could you speak a bit more slowly?",
      meaningAr: "هل يمكنك التحدث ببطء أكثر قليلاً؟",
      placeId: "bakery",
    },
    dialogue: [
      {
        id: "greet",
        prompt: "Hello there! Looking for anything in particular?",
        hint: { text: "Which one do you recommend?", meaningAr: "أيّها تنصح به؟" },
        sampleAnswer: "Which bread you recommend?",
        reply: "The sourdough, no question.",
      },
      {
        id: "take",
        prompt: "It's still warm. Would you like one?",
        hint: { text: "I'll take one, please.", meaningAr: "سآخذ واحداً، من فضلك." },
        sampleAnswer: "Yes, I'll take one, please.",
        reply: "Lovely choice.",
      },
    ],
    recasts: [
      {
        id: "which-you-recommend",
        pattern: "\\bwhich (\\w+ )?you recommend\\b",
        better: "Which one do you recommend",
        recast: "Which one do I recommend",
        replyTemplate: "{recast}? The sourdough, no question.",
        explanationAr: "في الأسئلة نضيف «do»: «Which one do you recommend?».",
      },
    ],
    closing: "There you go. Enjoy it while it's warm!",
  },
];

export const getScene = (id: string) => scenes.find((s) => s.id === id);

/** The scene featured on the Town screen as "Today's scene". */
export const todaysSceneId = "cafe-order";

/** Every phrase in town, keyed by id (phrasebook lookups). */
export const phrasesById = new Map(
  scenes.flatMap((s) => [...s.keyPhrases, s.rescuePhrase]).map((p) => [p.id, p] as const),
);
