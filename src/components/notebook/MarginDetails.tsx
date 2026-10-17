import { EditableText } from "@/components/studio/EditableText";
import { bindBlock, bindField } from "@/lib/studio/bindings";
import { contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";
import { Markdown } from "./Markdown";

export function MarginDetails() {
  const home = readContent("home");

  /** Shared rail copy stays in the same Markdown document as the home page. */

  return (
    <>
      <p className="margin-location"><EditableText binding={bindField(home, ["location"])}>{contentField<string>(home, "location")}</EditableText></p>
      <div className="margin-contact">
        <Markdown {...bindBlock(home, "github-xnmp-https-github")} />
        <Markdown {...bindBlock(home, "chonw-proton")} />
      </div>
    </>
  );
}
