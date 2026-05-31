---
name: agentic-demo-flow
description: Use this skill when implementing the multi-step agent workflow: mood parsing, candidate retrieval, bio ingestion, personality analysis, council composition, dialogue generation, and action planning.
---

The demo must visibly show an agentic workflow:
1. Mood Parser
2. Search Agent
3. Bio Ingestion
4. Personality Analyzer
5. Council Composer
6. Dialogue Engine
7. Tiny Action Planner

Implementation rules:
- Each stage should produce structured JSON internally.
- UI should display trace summaries, not raw chain-of-thought.
- The pipeline must work without external APIs.
- If web ingestion succeeds, display "联网补充".
- If it fails, display "使用本地人物库".
- Candidate scoring:
  final_score =
    0.35 * emotion_similarity
  + 0.25 * behavior_similarity
  + 0.20 * evidence_quality
  + 0.10 * persona_fun_score
  + 0.10 * diversity_score
- For "我好懒真的不想干了", pick:
  Hu Shi, Su Shi, Wang Yangming
  Optionally add Zhuangzi as group chat moderator.
- End with a tiny action plan under 10 minutes.
