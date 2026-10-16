// A candidate failure can improve with a new model output. Source, filesystem,
// provenance and publication errors deliberately do not use this type.
export class CandidateRejected extends Error {
  constructor(message, tiles = []) { super(message); this.tiles = tiles; }
}

// Replacing only some failed tiles would make the remaining missing tiles look
// like free initial requests on the next pass. Reserve the entire set or stop.
export const retrySelection = (tiles, spent, limit) => {
  const unique = [...new Set(tiles)];
  return unique.length <= Math.max(0, limit - spent) ? unique : [];
};
