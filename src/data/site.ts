import { contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

/** Shared server-rendered branding; no page keeps its own copy. */
export const readSiteBrand = () => contentField<string>(readContent("home"), "brand");
export const SITE_BRAND = readSiteBrand();
