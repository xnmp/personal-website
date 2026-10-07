"use client";

import { Key } from "@/components/rack/Key";
import { assetUrl, buildFor } from "./platform";
import { useOS } from "./useOS";

/**
 * The download key: the build for the visitor's OS when it is known, and the
 * release page (every desktop build) otherwise, labelled as such so a phone
 * visitor doesn't expect an install. The server and the first client render
 * show the release page, so nothing hydrates differently.
 */
export function DownloadKey({
  repo,
  version,
  others = false,
  primary = false,
}: {
  repo: string;
  version: string;
  /** also offer the release page next to an OS-specific build */
  others?: boolean;
  /** the section's main action: printed on the signal board */
  primary?: boolean;
}) {
  const tone = primary ? "signal" : undefined;
  const os = useOS();
  const releases = `${repo}/releases/latest`;
  if (!os)
    return (
      <Key href={releases} size="lg" tone={tone} ariaLabel={`All desktop builds of ${version}, on GitHub`}>
        All desktop builds ↗
      </Key>
    );
  const build = buildFor(os, version);
  return (
    <>
      <Key href={assetUrl(repo, version, build.file)} size="lg" tone={tone} ariaLabel={`${build.label} (${version}, ${build.kind})`}>
        {build.label}
      </Key>
      {others ? (
        <Key href={releases} size="lg">
          Other builds
        </Key>
      ) : null}
      {build.note ? (
        <p className="download-note note">
          {build.note}
          {others ? null : (
            <>
              {" "}
              <a href={releases}>Every build</a>
            </>
          )}
        </p>
      ) : null}
    </>
  );
}
