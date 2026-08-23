import type { PageDataLoad } from "@deijose/nix-js-kit";
import { load as layoutLoad } from "../../layout.data";

export const load: PageDataLoad = async (ctx) => {
  // The layout loader already loads everything; just re-run it here
  // so the page has access to the same data.
  return layoutLoad(ctx);
};
