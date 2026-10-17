import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ContentStudio } from "@/components/studio/ContentStudio";
import { studioEnabled } from "@/lib/studio/security.server";
import "./studio.css";

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
  return <ContentStudio token={process.env.CONTENT_STUDIO_TOKEN!} />;
}
