import { fallbackBiographyIllustrationDataUrl } from "@/lib/visual-assets";

type ImageGenerationResult = {
  imageUrl: string;
  usedModel: boolean;
};

export async function maybeGenerateImage(prompt: string, fallbackHint: string, timeoutMs = 18000, fallbackUrl?: string): Promise<ImageGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const fallback = fallbackUrl ?? fallbackBiographyIllustrationDataUrl(fallbackHint);
  if (!apiKey) return { imageUrl: fallback, usedModel: false };

  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.longxiadev.store/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        prompt,
        size: "1024x1024",
        n: 1
      })
    });
    clearTimeout(timeout);
    if (!response.ok) return { imageUrl: fallback, usedModel: false };

    const data = (await response.json()) as { data?: Array<{ url?: string; b64_json?: string }> };
    const image = data.data?.[0];
    if (image?.b64_json) return { imageUrl: `data:image/png;base64,${image.b64_json}`, usedModel: true };
    if (image?.url) return { imageUrl: image.url, usedModel: true };
    return { imageUrl: fallback, usedModel: false };
  } catch {
    clearTimeout(timeout);
    return { imageUrl: fallback, usedModel: false };
  }
}
