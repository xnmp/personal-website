import { authorizeStudio, StudioError } from "@/lib/studio/security.server";
import {
  contentIds,
  readDocument,
  saveDocument,
} from "@/lib/studio/store.server";
import {
  assertPublishRemote,
  busyJob,
  publishContent,
} from "@/lib/studio/publish.server";
import {
  recordPublication,
  studioBase,
  studioRuntime,
} from "@/lib/studio/runtime.server";

export const runtime = "nodejs";
const root = process.cwd();
const errorResponse = (error: unknown) =>
  Response.json(
    { error: error instanceof Error ? error.message : "Editor request failed" },
    {
      status: error instanceof StudioError ? error.status : 400,
      headers: { "Cache-Control": "no-store" },
    },
  );

export async function GET(request: Request) {
  try {
    authorizeStudio(request);
    await studioBase(root);
    const parameters = new URL(request.url).searchParams;
    if (parameters.has("status")) return Response.json({ job: studioRuntime.job }, { headers: { "Cache-Control": "no-store" } });
    const id = parameters.get("id");
    if (id)
      return Response.json(
        { document: await readDocument(root, id) },
        { headers: { "Cache-Control": "no-store" } },
      );
    const documents = await Promise.all(
      (await contentIds(root)).map(async (id) => {
        const { title, route } = await readDocument(root, id);
        return { id, title, route };
      }),
    );
    return Response.json(
      { documents, job: studioRuntime.job },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    authorizeStudio(request);
    const length = Number(request.headers.get("content-length"));
    if (length > 1_500_000)
      throw new StudioError(413, "Editor request is too large");
    const reader = request.body?.getReader();
    if (!reader) throw new StudioError(400, "Missing request body");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 1_500_000) {
        await reader.cancel();
        throw new StudioError(413, "Editor request is too large");
      }
      chunks.push(chunk.value);
    }
    const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (input?.action === "save") {
      if (busyJob(studioRuntime.job))
        throw new StudioError(
          409,
          "Wait for the deployment to finish before saving more changes",
        );
      if (
        typeof input.id !== "string" ||
        typeof input.revision !== "string" ||
        !input.edits ||
        typeof input.edits !== "object" ||
        Array.isArray(input.edits) ||
        Object.values(input.edits).some((value) => typeof value !== "string")
      )
        throw new StudioError(400, "Invalid save request");
      return Response.json({ document: await saveDocument(root, input) });
    }
    if (input?.action === "deploy") {
      if (busyJob(studioRuntime.job))
        throw new StudioError(409, "A deployment is already running");
      await assertPublishRemote(root);
      if (busyJob(studioRuntime.job))
        throw new StudioError(409, "A deployment is already running");
      const base = await studioBase(root);
      if (busyJob(studioRuntime.job))
        throw new StudioError(409, "A deployment is already running");
      const startedAt = Date.now();
      studioRuntime.job = {
        phase: "validating",
        message: "Preparing your content…",
        startedAt,
      };
      void publishContent({
        root,
        base,
        baselines: studioRuntime.baselines,
        published: (commit, ids) => recordPublication(root, commit, ids),
        progress: (job) => {
          studioRuntime.job = { ...job, startedAt };
        },
      }).catch((error) => {
        studioRuntime.job = {
          ...studioRuntime.job,
          phase: "error",
          message: error instanceof Error ? error.message : "Deployment failed",
          startedAt,
        };
      });
      return Response.json({ job: studioRuntime.job }, { status: 202 });
    }
    throw new StudioError(400, "Unknown editor action");
  } catch (error) {
    return errorResponse(error);
  }
}
