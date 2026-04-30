# Context: Monologue Notes

This doc was drafted on the day Monologue Notes launched. The rest of the repo was in progress before the announcement dropped, which means the Monologue section of WEDGE_MAP.md is partially stale. I'm not editing the original retroactively — you should see the re-tier as a revision, not a cover-up. And the launch itself sharpens a point I want to name directly.

## What changed

**Before today:** Monologue was a voice-to-text dictation app. Its competitors were Wispr Flow, Superwhisper, Voibe, Apple Dictation — all dictation tools. That's how I mapped it.

**After today:** Monologue is an **agent-native audio capture layer.** It's not competing with dictation apps anymore. It's competing with Granola (meeting capture), Rewind (passive recall), and every "record your thinking" tool that exists — *and* it's a platform with MCP / API / CLI access.

This is a category change, not a feature launch.

## What I'd rewrite in WEDGE_MAP.md if I had another hour

- Re-tier Monologue's competitor set: Granola, Rewind, Otter, Circleback, Fireflies, Cleft, Limitless Pendant, Plaud — not Wispr et al
- Replace the "voice-to-text" framing with "voice → transcript → agent → action"
- Add a row for *"the DIY version"* — someone who records on Voice Memos + manually pastes to ChatGPT. Same user, same pain, way worse experience. That's the acquisition pool
- The week-one play in WEEK_ONE.md still holds, but the messaging shifts from "Wispr is $15, Every is $30 with four tools" to "Wispr ends at transcription. Monologue Notes ends at a shipped commit."

## The bigger point

Monologue Notes is a platform moment disguised as a product launch. With MCP / API / CLI exposed, **anyone can now build a skill that reads Monologue transcripts and does something useful.**

That means a GTME at Every doesn't just ship experiments anymore — they can ship skills that sit on the platform, grow the ecosystem, and compound. Examples I'd draft on Monday:

- **Studio skill** (my domain — rap sessions): Monologue Notes records, my Claude Code skill pulls the transcript at session end, generates a lyric sheet, a take-log, and a next-session brief. Distribution: rap Twitter + producer communities.
- **Founder morning-brief skill:** agent pulls the walk note, cross-references Linear + GitHub + Notion, returns a prioritized day-plan. Distribution: founder Twitter + Lenny's readership.
- **Customer-call skill:** agent pulls call transcript, writes the follow-up email, creates the Linear ticket, drafts the CHANGELOG entry if it was a bug. Distribution: support-engineer Twitter.

Each skill is a content asset + an acquisition vehicle + proof of the platform. **The GTM motion for Monologue Notes is itself agentic.**

## Why I care about this specifically

I've been building the same primitive for a different domain — rap sessions — for months. I'm a rapper. My basement studio workflow was the same broken loop Naveen described: best thinking happens in the booth, vanishes into Apple Notes, never ships. I built **punch2pen** (a C++/JUCE DAW plugin with a Whisper transcription engine via IPC) to capture that voice, and **Hector** (my local Hermes Agent with a Studio Engineer skill) to turn it into action.

Reading Naveen's post this afternoon was uncanny. Same primitive, different craft.

That's not a resume flex. It's the reason I think I'd be useful Monday. I already know where this product bends the universe. I've been living in it.

— Keegan
