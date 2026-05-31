# 俺也一样

## Demo
输入一句真实情绪，系统会先用本地人物库召回相似人生片段；如果开启联网 RAG，会再通过公开 Wikipedia/Wikisource API 抓取人物传记、作品、日记/书信/年谱等页面片段作为私有上下文，然后把一个或多个历史人物拉进拟态群聊。

## Run
```bash
pnpm install
pnpm dev
```

## Optional env
```bash
OPENAI_API_KEY=
OPENAI_BASE_URL=https://tokendance.space/gateway/v1
OPENAI_MODEL=gpt-5.5
ENABLE_WEB_INGEST=true
ENABLE_WEB_RAG=true
```

TokenDance model IDs can be checked with:
```bash
curl https://tokendance.space/gateway/v1/models
```

`gpt-5.5` is the default for the hackathon demo because the persona matching and chat quality matter more than raw speed. You can replace it with any OpenAI-compatible chat-completions model ID supported by your gateway.

## Demo script
1. Open http://localhost:3000
2. Type: 我好懒真的不想干了
3. Click 发送
4. Select one or more persona cards above the chat
5. Click 完成
6. Watch selected historical personas join and reply in the chat
7. Continue typing in the same group chat

## Safety and historical grounding
- Generated persona dialogue is dramatization.
- Facts, analogies, and dramatization are separated.
- The Hu Shi card includes a caveat about internet meme vs diary evidence.
- High-risk self-harm language triggers safety mode instead of playful mode.
- Web RAG chunks are background context only; they are not shown as direct quotes unless verified.

## Architecture
- Frontend: Next.js + React + Tailwind
- Backend: Next.js route handlers
- Agent pipeline: safety router, LLM situation analyst, web RAG ingest, experience matcher, dialogue generator
- Data: TypeScript seed profiles + runtime MediaWiki/Wikisource retrieval cache
