import { NextResponse } from "next/server";
import { z } from "zod";
import { getPersonById } from "@/lib/seed-people";
import { fetchWikiSummary } from "@/lib/wiki";
import { parseMood } from "@/lib/mood-parser";
import { fetchWebRagChunks } from "@/lib/web-rag";

const querySchema = z.object({
  person: z.string().min(1),
  input: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { person: personId, input } = querySchema.parse({
      person: url.searchParams.get("person"),
      input: url.searchParams.get("input") ?? undefined
    });
    const person = getPersonById(personId);

    if (!person) {
      return NextResponse.json({ ok: true, source: null, chunks: [], message: "未找到人物，使用本地人物库。" });
    }

    const analysis = parseMood(input ?? "我好懒真的不想干了");
    const [source, chunks] = await Promise.all([fetchWikiSummary(person), fetchWebRagChunks(person, 6, analysis)]);
    return NextResponse.json({
      ok: true,
      source,
      chunks,
      message: chunks.length || source ? "联网RAG补充成功" : "联网补充已尝试，当前使用本地人物库。"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid query", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      source: null,
      chunks: [],
      message: "联网补充失败，当前使用本地人物库。"
    });
  }
}
