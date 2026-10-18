import { bindBlock } from "@/lib/studio/bindings";
import { RunningHead } from "@/components/notebook/RunningHead";
import { ProjectDirectory } from "@/components/landing/ProjectDirectory";
import { Markdown } from "@/components/notebook/Markdown";
import { RackKeys } from "@/components/rack";
import { contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("home"), "metadata");
}

/** Every art direction presents this same authored directory. */
export default function ProjectsPage() {
  const content = readContent("home");
  return (
    <>
      <RackKeys />
      <RunningHead meta={<Markdown {...bindBlock(content, "projects")} inline />} />
      <main id="content" className="rack-main" tabIndex={-1}>
        <ProjectDirectory />
      </main>
      <footer className="statusline">
        {/* each key with what it does, unbroken, its separator trailing it (the
            spaces explicit: one before an entity on its line is dropped) */}
        <span className="sl-keys fine-only"><Markdown {...bindBlock(content, "spankbdj-kbdk-projects-spankbd-open-spankbd-search-spankbd")} inline /></span>
        <span className="sl-contact"><Markdown {...bindBlock(content, "github-xnmp-https-github")} inline /></span>
        <span className="sl-contact"><Markdown {...bindBlock(content, "chonw-proton")} inline /></span>
        <span><Markdown {...bindBlock(content, "screens-themed-by-my-dotfiles-https-github")} inline /></span>
        <span><Markdown {...bindBlock(content, "art-generated-composited-for-this-site")} inline /></span>
      </footer>
    </>
  );
}
