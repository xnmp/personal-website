import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { studioEnabled } from "@/lib/studio/security.server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Content · chong.md",
  robots: { index: false, follow: false },
};

export default async function StudioPage() {
  if (!studioEnabled()) notFound();
  const incoming = await headers();
  if (
    incoming.get("host") !== new URL(process.env.CONTENT_STUDIO_ORIGIN!).host ||
    incoming.get("sec-fetch-site") === "cross-site"
  )
    notFound();
  redirect("/");
}
