import { Fragment } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Link from "next/link";
import type { MarkdownProps } from "./MarkdownRenderer";

const BLOCK_ELEMENTS = new Set(["blockquote", "div", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "li", "ol", "p", "pre", "table", "tbody", "td", "th", "thead", "tr", "ul"]);

/** Opt-in typesetting; ordinary prose keeps its existing lightweight renderer. */
export default function MathMarkdownRenderer({ text, inline = false, allowLinks = true, paragraphClassName, paragraphStyle }: MarkdownProps) {
  return <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[[rehypeKatex, { trust: false, strict: "warn" }]]}
    allowElement={element => (!inline || !BLOCK_ELEMENTS.has(element.tagName)) && (allowLinks || element.tagName !== "a")}
    unwrapDisallowed
    components={{
      p: ({ children }) => inline ? <Fragment>{children}</Fragment> : <p className={paragraphClassName} style={paragraphStyle}>{children}</p>,
      h2: ({ children }) => <h2 className="md-heading">{children}</h2>,
      h3: ({ children }) => <h3 className="md-heading">{children}</h3>,
      h4: ({ children }) => <h4 className="md-heading">{children}</h4>,
      ul: ({ children }) => <ul className="md-list">{children}</ul>,
      ol: ({ children }) => <ol className="md-list">{children}</ol>,
      table: ({ children }) => <div className="math-table" role="region" aria-label="Mathematical table" tabIndex={0}><table>{children}</table></div>,
      a: ({ href, children }) => href?.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href}>{children}</a>,
    }}
  >{text}</ReactMarkdown>;
}
