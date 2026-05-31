import { NextResponse } from "next/server";
import { z } from "zod";
import { generateBiographyEntry } from "@/lib/biography";
import type { DialogueMessage } from "@/lib/types";

const biographySchema = z.object({
  sessionId: z.string().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  personIds: z.array(z.string()).max(8).default([]),
  messages: z
    .array(
      z.object({
        id: z.string().optional(),
        speakerId: z.string(),
        speakerName: z.string(),
        speakerEmoji: z.string().optional(),
        role: z.string(),
        content: z.string().max(900),
        type: z.enum(["user", "persona", "host", "system"]),
        layer: z.enum(["fact", "analogy", "dramatization"]).optional()
      })
    )
    .min(1)
    .max(40)
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { sessionId, date, personIds, messages } = biographySchema.parse(json);
    const normalizedMessages: DialogueMessage[] = messages.map((message, index) => ({
      id: message.id ?? `bio-history-${index}`,
      speakerId: message.speakerId,
      speakerName: message.speakerName,
      speakerEmoji: message.speakerEmoji ?? "",
      role: message.role,
      content: message.content,
      type: message.type,
      layer: message.layer
    }));

    const entry = await generateBiographyEntry({
      sessionId,
      date,
      personIds,
      messages: normalizedMessages
    });

    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "Biography generation failed" }, { status: 500 });
  }
}
