import Link from "next/link";
import {
  RunningHead,
  Divider,
  Entry,
  EntryLabel,
  EntryHeading,
  Tags,
  Tag,
  OpenQuestion,
  MarginNote,
  Plate,
  Features,
  Feature,
  Folio,
  PageBackground,
} from "@/components/notebook";
import { TauriSchematic } from "@/components/demos/TauriSchematic";

export default function Home() {
  return (
    <>
      <PageBackground src="/bg/watercolor-1.jpg" />
      <RunningHead
        brand="Chong"
        meta={
          <>
            Entry I &nbsp;·&nbsp; MMXXVI — ongoing &nbsp;·&nbsp; filed under{" "}
            <span className="filed">passions</span>
          </>
        }
      />

      <section className="hero">
        <div>
          <h1 className="title">
            A notebook
            <br />
            of <em>small things</em>.
          </h1>
          <p className="lede">
            A running record of the tools, games, and small studies I keep
            returning to. Some are finished, some never will be, and a few are{" "}
            <b>still producing new observations</b>.
          </p>
          <div className="byline">
            <a href="https://github.com/xnmp">github/xnmp</a> &nbsp;·&nbsp;{" "}
            <a href="mailto:chonw@proton.me">chonw@proton.me</a>
          </div>
        </div>
        <MarginNote label="Marginalia">
          Each entry is a project or an open question. Plates are sketched from
          life; citations live in the footer. Take what&rsquo;s useful; argue
          with the rest.
        </MarginNote>
      </section>

      <Divider>◆&nbsp;&nbsp;Entry I&nbsp;&nbsp;◆</Divider>

      <Entry
        left={
          <>
            <EntryLabel number="№ 01" title="Tauri Explorer" />
            <Link href="/p/tauri-explorer" className="entry-link">
              <EntryHeading>
                A file manager with the soul of an IDE.
              </EntryHeading>
            </Link>
            <p>
              <code>Ctrl+P</code> for frecency fuzzy-find.{" "}
              <code>Ctrl+Shift+F</code> for ripgrep across the tree. A command
              palette that surfaces every action. Minimal by default —
              everything else is a shortcut away.
            </p>
            <Tags>
              <Tag>rust</Tag>
              <Tag>tauri v2</Tag>
              <Tag>svelte 5</Tag>
              <Tag>open source</Tag>
            </Tags>
            <OpenQuestion>
              Should frecency decay differently per file type — faster for
              downloads, slower for source?
            </OpenQuestion>
            <Link href="/p/tauri-explorer" className="read-more">
              read the full entry →
            </Link>
          </>
        }
        right={
          <Link href="/p/tauri-explorer" className="entry-link">
            <Plate
              figure="FIG. I — Chromeless by default"
              caption="Fig. I — dual-pane navigation, command palette floated over an active selection."
            >
              <TauriSchematic />
            </Plate>
            <Features>
              <Feature label="Ctrl+P quick open">
                Fuzzy search the tree, ranked by frecency.
              </Feature>
              <Feature label="Ctrl+Shift+F">
                Ripgrep-backed content search across every file.
              </Feature>
              <Feature label="Command palette">
                Every action, rebindable. Chord bindings like <code>g h</code>.
              </Feature>
              <Feature label="Dual pane + tabs">
                Copy across panes, restore closed tabs, 10k+ files still instant.
              </Feature>
            </Features>
          </Link>
        }
      />

      <Folio number="i" />
    </>
  );
}
