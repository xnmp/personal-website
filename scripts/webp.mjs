// How a kit's surfaces are encoded. Lossy by default: painted materials
// (paper, brass, stone) hide its artefacts. A kit of flat colour inside hard
// ink lines (`lossless: true` in its config, which build-kit.mjs passes on
// to every step it runs as KIT_LOSSLESS) is encoded losslessly: lossy WebP
// halves the chroma resolution, so a colour laid beside a thin line (a focus
// band inside an ink border) bleeds a pixel into it, and flat colour
// compresses as small without loss. Lossy encodes subsample chroma the
// slow, careful way (sharp's `smartSubsample`, libwebp's sharp YUV), so a
// saturated band laid beside a painted edge (a glaze inside stone) does not
// tint the edge's last pixels.
export const webpOptions = (quality, alphaQuality = 100) =>
  process.env.KIT_LOSSLESS === "1" ? { lossless: true } : { quality, alphaQuality, smartSubsample: true };
