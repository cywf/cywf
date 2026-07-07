// G8S TID-129 — json-render catalog for the Developer Analytics card.
// A guardrailed component catalog: the generator may ONLY emit these components,
// so the rendered output is always predictable and safe to embed in the README.
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/image/schema";

// Design tokens (kept in one place so the card restyles from a single edit).
export const theme = {
  bg: "#0d1117",
  panel: "#161b22",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#8b949e",
  accent: "#3b5bdb",
  accent2: "#0b7285",
  good: "#2ea043",
};

// The catalog uses the image renderer's standard primitives (Frame / Stack /
// Heading / Text / Box) as building blocks. We describe intent; generate.mjs
// fills values. Keeping the catalog small is deliberate — fewer components,
// more predictable specs.
export const catalog = defineCatalog(schema, {
  components: {
    Frame: { description: "Root canvas for the analytics card (fixed w/h, bg)." },
    Stack: { description: "Vertical or horizontal flexbox container." },
    Heading: { description: "Section or card title." },
    Text: { description: "A line of body/label text." },
    Box: { description: "A colored rectangle — used for bars, chips, dividers." },
  },
  actions: {},
});

export default catalog;
