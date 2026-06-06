export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Is my data private?",
    a: "[PLACEHOLDER: e.g. 'Your messages are processed for rewriting and never stored. Your Writing DNA profile is encrypted and only you can access or delete it. We never sell or share your data.']",
  },
  {
    q: "Will it actually sound like me?",
    a: "Writing Twin learns from your own messages — not a generic template. The more samples you provide, the more accurate it gets. Most users say the output feels like 'me after a good night's sleep — cleaner, but still mine.'",
  },
  {
    q: "Which platforms does it work on?",
    a: "Gmail, Outlook, LinkedIn, and Slack. More platforms are planned — vote at support@writingtwinai.com.",
  },
  {
    q: "How does it learn my writing?",
    a: "During onboarding you paste 3–5 messages you've written. Writing Twin extracts your sentence rhythm, word choice, and tone in about 30 seconds. You can retrain anytime from the dashboard.",
  },
  {
    q: "I'm a non-native English speaker. Will this help?",
    a: "Yes — this is exactly what Writing Twin is built for. It corrects grammar and stiffness while preserving your authentic voice and intent. You'll sound like a fluent, professional version of yourself — not like a generic AI.",
  },
  {
    q: "How is this different from Grammarly?",
    a: "Grammarly fixes grammar. Writing Twin fixes voice. It takes your AI-generated or stiff-sounding draft and rewrites it to match how you actually communicate — not just correct it.",
  },
  {
    q: "What's the pricing during beta?",
    a: "Free plan: 20 rewrites/month, no credit card required. Pro founding member: $5/month for 300 rewrites. This price is locked in for life if you join during beta.",
  },
  {
    q: "What's the difference between free and pro?",
    a: "Free gives you 20 rewrites per month — plenty for occasional use. Pro gives you 300 rewrites/month plus priority support and early access to new features.",
  },
];
