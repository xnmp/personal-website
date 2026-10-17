import { timingSafeEqual } from "node:crypto";

export function studioEnabled(env = process.env): boolean {
  return (
    env.CONTENT_STUDIO === "1" &&
    env.NODE_ENV === "development" &&
    !env.VERCEL &&
    Boolean(env.CONTENT_STUDIO_TOKEN) &&
    Boolean(env.CONTENT_STUDIO_ORIGIN)
  );
}

export function authorizeStudio(request: Request, env = process.env): void {
  if (!studioEnabled(env)) throw new StudioError(404, "Not found");
  const origin = env.CONTENT_STUDIO_ORIGIN!;
  // Next constructs an internal localhost URL even when the incoming Host is 127.0.0.1.
  // The actual Host and browser Origin are the request authority checks.
  if (request.headers.get("host") !== new URL(origin).host)
    throw new StudioError(
      403,
      "This editor is available on its local address only",
    );
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new StudioError(403, "Cross-site editor requests are not allowed");
  if (request.method !== "GET" && request.headers.get("origin") !== origin)
    throw new StudioError(403, "Invalid editor origin");
  const actual = Buffer.from(request.headers.get("x-studio-token") ?? "");
  const expected = Buffer.from(env.CONTENT_STUDIO_TOKEN!);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new StudioError(403, "Invalid editor session; reload the editor");
}

export class StudioError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
