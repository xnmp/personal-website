import { EditableText } from "@/components/studio/EditableText";
import type { ContentBinding } from "@/lib/studio/bindings";
import Image from "next/image";

/** A window-chrome frame around a real product screenshot. */
export function Window({
  src,
  alt,
  title,
  titleBinding,
  width,
  height,
  priority = false,
  sizes = "(max-width: 880px) 100vw, 700px",
}: {
  src: string;
  alt: string;
  title: string;
  titleBinding?: ContentBinding;
  width: number;
  height: number;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <figure className="tf-window" style={{ margin: 0 }}>
      <div className="tf-window-bar">
        <span className="tf-dot" />
        <span className="tf-dot" />
        <span className="tf-dot" />
        <span className="tf-window-title">
          <EditableText binding={titleBinding}>{title}</EditableText>
        </span>
      </div>
      <div className="tf-window-shot">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          priority={priority}
          style={{ width: "100%", height: "auto" }}
        />
      </div>
    </figure>
  );
}
