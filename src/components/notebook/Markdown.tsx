import { Children, Fragment, isValidElement, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import rehypeHighlight from "rehype-highlight";
import javascript from "highlight.js/lib/languages/javascript";
import bash from "highlight.js/lib/languages/bash";
import { Cap } from "@/components/rack/Key";
import { ForOS } from "@/components/launch/ForOS";
import Link from "next/link";
import { MARKDOWN_VARIANTS } from "./markdown-variants";
import type { Root } from "mdast";
import type { Node } from "unist";

function textContent(children: ReactNode): string {
  return Children.toArray(children).map(child =>
    typeof child === "string" || typeof child === "number" ? String(child)
      : isValidElement<{ children?: ReactNode }>(child) ? textContent(child.props.children) : ""
  ).join("");
}

/** Only these code-owned inline helpers can be embedded in authored Markdown. */
function inlineDirectives() {
  return (tree: Root, file: { value: string | Uint8Array }) => {
    function visit(node: Node) {
      if (node.type === "textDirective") {
        const directive = node as Node & { name: string; attributes?: Record<string, string>; data?: Record<string, unknown> };
        if (!["kbd", "os", "nowrap", "break", "span", "code", "link", "command"].includes(directive.name)) {
          Object.assign(node, { type: "text", value: String(file.value).slice(node.position?.start.offset, node.position?.end.offset) });
          return;
        }
        directive.data = {
          hName: directive.name === "code" ? "code" : directive.name === "link" ? "a" : "span",
          hProperties: {
            "data-inline": directive.name,
            className: directive.attributes?.class,
            "data-variant": directive.attributes?.variant,
            ...(directive.name === "link" ? { href: directive.attributes?.href } : {}),
          },
        };
      }
      if ("children" in node) (node.children as Node[]).forEach(visit);
    }
    visit(tree);
  };
}

/** No raw HTML or executable MDX. Inline mode fits headings, captions and keys. */
export function Markdown({ text, inline = false, paragraphClassName, paragraphStyle }: { text: string; inline?: boolean; paragraphClassName?: string; paragraphStyle?: CSSProperties }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkDirective, inlineDirectives]}
      rehypePlugins={[[rehypeHighlight, { languages: { javascript, bash }, ignoreMissing: true }]]}
      components={{
        p: ({ children }) => inline ? <Fragment>{children}</Fragment> : <p className={paragraphClassName} style={paragraphStyle}>{children}</p>,
        span: ({ node, children, className }) => {
          switch (node?.properties["data-inline"]) {
            case "kbd": return <Cap inline>{children}</Cap>;
            case "os": return <ForOS>{textContent(children)}</ForOS>;
            case "nowrap": return <span className="nowrap">{children}</span>;
            case "break": return <wbr />;
            case "command": {
              const command = textContent(children);
              const split = command.indexOf(":") + 1;
              return <code className="cmd-text">{command.slice(0, split)}<wbr /><span className="nowrap">{command.slice(split)}</span></code>;
            }
            default: return <span className={className} style={MARKDOWN_VARIANTS[String(node?.properties["data-variant"])]}>{children}</span>;
          }
        },
        a: ({ href, className, children }) => href?.startsWith("/")
          ? <Link href={href} className={className}>{children}</Link>
          : <a href={href} className={className}>{children}</a>,
        code: ({ node, children, className }) => <code className={className} style={MARKDOWN_VARIANTS[String(node?.properties["data-variant"])]}>{children}</code>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
