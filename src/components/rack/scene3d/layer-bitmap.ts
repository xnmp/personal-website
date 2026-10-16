/** The layers keep enough pixels for the canvas, up to the 2x art's width. */
export const layerTextureWidth = (bufferWidth: number, small: boolean) =>
  Math.min(3840, Math.max(small ? 1280 : 1920, Math.ceil(bufferWidth / 640) * 640));

/** Decode once at the art's own size; a smaller source never gets stretched. */
export async function layerBitmap(blob: Blob, width: number, decode = createImageBitmap) {
  const img = await decode(blob, { imageOrientation: "flipY", premultiplyAlpha: "premultiply" });
  if (img.width <= width) return img;
  try {
    // the decoded art is already flipped, so the resize names no orientation:
    // the default keeps it as it is ("from-image" is too new to name everywhere)
    return await decode(img, { premultiplyAlpha: "premultiply", resizeWidth: width, resizeQuality: "high" });
  } finally {
    img.close();
  }
}
