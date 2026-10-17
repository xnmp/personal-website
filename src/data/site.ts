import { contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

/** Shared server-rendered branding; no page keeps its own copy. */
export const SITE_BRAND = contentField<string>(readContent("home"), "brand");
