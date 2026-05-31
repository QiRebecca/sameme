import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDialogue, dramatizationDisclaimer } from "@/lib/dialogue-templates";
import { detectSafetyRisk, safetyMessage } from "@/lib/safety";
import type { DialogueMessage } from "@/lib/types";

const dialogueSchema = z.object({
  input: z.string().min(1).max(500),
  mode: z.enum(["one_on_one", "group_chat", "tiny_action"]),
  personIds: z.array(z.string()).default([]),
  history: z
    .array(
      z.object({
        speakerId: z.string(),
        speakerName: z.string(),
        role: z.string(),
        content: z.string().max(700),
        type: z.enum(["user", "persona", "host", "system"])
      })
    )
    .max(20)
    .default([])
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { input, mode, personIds, history } = dialogueSchema.parse(json);

    if (detectSafetyRisk(input) === "high") {
      return NextResponse.json({
        ok: true,
        safety: true,
        message: safetyMessage,
        messages: [],
        actionPlan: null,
        disclaimer: dramatizationDisclaimer
      });
    }

    const normalizedHistory: DialogueMessage[] = history.map((message, index) => ({
      id: `history-${index}`,
      speakerId: message.speakerId,
      speakerName: message.speakerName,
      speakerEmoji: "",
      role: message.role,
      content: message.content,
      type: message.type
    }));
    const result = await generateDialogue(input, mode, personIds, normalizedHistory);

    return NextResponse.json({
      ok: true,
      messages: result.messages,
      actionPlan: result.actionPlan,
      disclaimer: dramatizationDisclaimer
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "Dialogue failed" }, { status: 500 });
  }
}
