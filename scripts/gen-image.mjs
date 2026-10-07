#!/usr/bin/env node
// Direct Gemini image API client (the nanobanana CLI extension has an auth bug).
// Usage: node scripts/gen-image.mjs <out.png> <aspect> <size> <prompt-file> [ref.png ...]
//   aspect: 1:1 | 16:9 | 9:16 | 3:2 | 2:3 | 4:3 | 21:9 ...   size: 1K | 2K | 4K
// Prompts are kept in files so every shipped asset has recorded provenance.
import { readFile, writeFile } from "node:fs/promises";

const [, , out, aspect = "16:9", size = "2K", promptFile, ...refs] = process.argv;
const key = process.env.GEMINI_API_KEY;
if (!out || !promptFile) throw new Error("usage: gen-image.mjs <out> <aspect> <size> <prompt-file> [refs...]");
if (!key) throw new Error("GEMINI_API_KEY not set");

const model = process.env.IMAGE_MODEL ?? "gemini-3-pro-image-preview";
const prompt = await readFile(promptFile, "utf8");
const refParts = await Promise.all(
  refs.map(async (p) => ({
    inlineData: {
      mimeType: p.endsWith(".jpg") || p.endsWith(".jpeg") ? "image/jpeg" : "image/png",
      data: (await readFile(p)).toString("base64"),
    },
  }))
);

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [...refParts, { text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: aspect, imageSize: size },
      },
    }),
  }
);
const json = await res.json();
if (!res.ok) throw new Error(JSON.stringify(json.error ?? json));
const img = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
if (!img) throw new Error("no image returned: " + JSON.stringify(json).slice(0, 500));
await writeFile(out, Buffer.from(img.inlineData.data, "base64"));
console.log("wrote", out);
