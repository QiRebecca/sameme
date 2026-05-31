---
name: historical-persona-grounding
description: Use this skill when generating or implementing historical-persona data, biography event cards, sources, caveats, and simulated dialogue boundaries.
---

Rules:
- Never fabricate direct quotes.
- Label generated persona speech as dramatization.
- Separate fact, interpretation, and playful performance.
- Prefer concrete life events over vague personality claims.
- For Hu Shi:
  - It is okay to mention diary records around card-playing, study, classes, self-observation, and self-discipline.
  - It is not okay to claim the internet meme version is a verified direct diary quote.
  - Use caveat text: "网传版本属于风格化复述/二创，不等同于原文。"
- For ancient figures, avoid overly specific claims unless in seed evidence.
- Avoid living-person impersonation in this demo.
- Keep the user-facing tone cute, but facts must be sober.
- Include confidence_score for each event/persona match.
