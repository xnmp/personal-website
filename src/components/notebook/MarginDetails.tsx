import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";
import { Markdown } from "./Markdown";

const home = readContent("home");

/** Shared rail copy stays in the same Markdown document as the home page. */
export function MarginDetails() {
  return (
    <>
      <p className="margin-location">{contentField<string>(home, "location")}</p>
      <div className="margin-contact">
        <Markdown text={contentBlock(home, "github-xnmp-https-github")} />
        <Markdown text={contentBlock(home, "chonw-proton")} />
      </div>
    </>
  );
}
