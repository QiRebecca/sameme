import { NextResponse } from "next/server";
import { z } from "zod";
import { runSagePipeline } from "@/lib/agent-pipeline";
import { safetyMessage } from "@/lib/safety";

const analyzeSchema = z.object({
  input: z.string().min(1).max(500)
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { input } = analyzeSchema.parse(json);
    const result = await runSagePipeline(input);

    if (result.analysis.riskLevel === "high") {
      return NextResponse.json({
        ok: true,
        safety: true,
        analysis: result.analysis,
        trace: result.trace,
        message: safetyMessage
      });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "Analyze failed" }, { status: 500 });
  }
}
