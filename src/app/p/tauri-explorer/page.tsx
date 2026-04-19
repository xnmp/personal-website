import Link from "next/link";
import {
  RunningHead,
  Divider,
  Tags,
  Tag,
  OpenQuestion,
  Plate,
  Features,
  Feature,
  Folio,
  PageBackground,
} from "@/components/notebook";
import { TauriSchematic } from "@/components/demos/TauriSchematic";

export const metadata = {
  title: "Tauri Explorer — Chong",
  description:
    "A file manager with the soul of an IDE. Ctrl+P frecency fuzzy-find, Ctrl+Shift+F ripgrep content search, a command palette, dual pane, tabs — all keyboard-driven, minimal by default.",
};

export default function TauriExplorerPage() {
  return (
    <>
      <PageBackground src="/bg/watercolor-2.jpg" />
      <RunningHead
        brand="Chong"
        meta={
          <>
            Entry I &nbsp;·&nbsp; Tauri Explorer &nbsp;·&nbsp; filed under{" "}
            <span className="filed">tools</span>
          </>
        }
      />

      <nav className="back-link">
        <Link href="/">← the notebook</Link>
      </nav>

      <section className="detail-hero">
        <div>
          <div className="kicker">№ 01 · Entry I</div>
          <h1>A file manager with the soul of an IDE.</h1>
          <p>
            <code>Ctrl+P</code> for frecency fuzzy-find.{" "}
            <code>Ctrl+Shift+F</code> for ripgrep across the tree. A command
            palette that surfaces every action. Tabs, dual pane, chord
            bindings. Minimal chrome by default — turn things on as you need
            them.
          </p>
        </div>
        <Tags>
          <Tag>rust</Tag>
          <Tag>tauri v2</Tag>
          <Tag>svelte 5</Tag>
          <Tag>open source</Tag>
        </Tags>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ I — The pitch</div>
          <h3>Why another file manager</h3>
        </div>
        <div>
          <p>
            Most file managers fall into two camps: polished and crippled
            (Finder, Explorer) or spartan and punishing (Ranger, lf, Midnight
            Commander). Tauri Explorer borrows from the one place that
            actually figured keyboard-driven navigation out — the IDE.
          </p>
          <p>
            <code>Ctrl+P</code> to fuzzy-open any file in the tree, ranked by
            how often and how recently you touched it.{" "}
            <code>Ctrl+Shift+F</code> to ripgrep the tree for content. A
            command palette for every action, rebindable, with chord
            sequences.
          </p>
          <p>
            The Rust backend handles directory listing, search, and
            thumbnails, so 10k-file directories don&rsquo;t choke the UI.
            Everything else — chrome, sidebars, columns — is off by default
            and toggleable. Turn on what you need.
          </p>
        </div>
      </section>

      <Divider>◆&nbsp;&nbsp;§ II&nbsp;&nbsp;◆</Divider>

      <section className="section">
        <div>
          <div className="section-kicker">§ II — The plate</div>
          <h3>Figure I</h3>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 8 }}>
            Dual-pane navigation with the quick-open palette floated over an
            active selection.
          </p>
        </div>
        <div>
          <Plate
            figure="FIG. I — Quick open, ranked by frecency"
            caption="Two panes, a palette, and whatever you ask for next."
          >
            <TauriSchematic />
          </Plate>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ III — The features</div>
          <h3>What it actually does</h3>
        </div>
        <div>
          <Features>
            <Feature label="Ctrl+P — Quick open">
              Fuzzy-find any file in the tree. Frecency ranks what you
              actually touch above what you once opened.
            </Feature>
            <Feature label="Ctrl+Shift+F — Content search">
              Ripgrep across the tree. Same shortcut as VS Code, same speed.
            </Feature>
            <Feature label="Command palette">
              Every action reachable. Rebindable. Chord bindings like{" "}
              <code>g h</code> to home, <code>g r</code> to root.
            </Feature>
            <Feature label="Tabs">
              <code>Ctrl+T</code>, <code>Ctrl+W</code>. Restore closed tabs.
              New windows inherit context from the last focused one.
            </Feature>
            <Feature label="Dual pane">
              <code>Ctrl+\</code>. Draggable split. Every op can target either
              side. Drag, copy, symlink between them.
            </Feature>
            <Feature label="Three view modes">
              Details, List, Tiles. Virtual scrolling for 10k+ files.
              Progressive thumbnails. Per-directory column preferences.
            </Feature>
            <Feature label="Full file ops">
              Copy, move, rename, bulk rename, trash, ZIP compress/extract,
              symlinks, undo/redo. Paste images from clipboard.
            </Feature>
            <Feature label="Breadcrumbs">
              Editable with path autocomplete. Chevron pickers browse
              subdirectories without navigating. Type-ahead to jump by name.
            </Feature>
            <Feature label="Deeply themable">
              8 built-in themes. Drop a <code>.css</code> in{" "}
              <code>~/.config/tauri-explorer/themes</code> and it loads.
              Background opacity, wallpaper, zoom.
            </Feature>
            <Feature label="Workspaces">
              Save and restore layouts. Sidebar bookmarks with drag-to-add
              and reorder. Every preference survives restarts.
            </Feature>
          </Features>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ IV — The rough edges</div>
          <h3>Open questions</h3>
        </div>
        <div>
          <OpenQuestion>
            Should frecency decay differently per file type — faster for
            downloads, slower for source?
          </OpenQuestion>
          <OpenQuestion label="Open question II">
            Is there a principled way to surface frequently-reached files in a
            foreign project you just cloned, before frecency has had time to
            learn the tree? Maybe seed from git-log frequency?
          </OpenQuestion>
          <OpenQuestion label="Open question III">
            If <code>Ctrl+P</code> finds files and <code>Ctrl+Shift+F</code>{" "}
            finds content, where does the &ldquo;minimal file manager&rdquo;
            end and the &ldquo;lightweight IDE&rdquo; begin? Should we add
            symbol jumping next, or is that a category error?
          </OpenQuestion>
        </div>
      </section>

      <section className="colophon">
        <div>
          Materials<strong>Rust, Tauri v2, Svelte 5</strong>
        </div>
        <div>
          Vintage<strong>MMXXVI — ongoing</strong>
        </div>
        <div>
          Platforms<strong>Linux · macOS · Windows</strong>
        </div>
        <div>
          Source
          <strong>
            <a href="https://github.com/xnmp/tauri-explorer">
              github/xnmp/tauri-explorer
            </a>
          </strong>
        </div>
      </section>

      <Folio number="1" />
    </>
  );
}
