// ============================================================================
// Home page data — loads nav sections for the landing page
// ============================================================================

import type { PageDataLoad } from "@deijose/nix-js-kit";
import { getDocsNav } from "./lib/docs-nav";

export const load: PageDataLoad = async () => {
  const sections = await getDocsNav();
  const headScripts = [
    "(function(){try{var t=localStorage.getItem('nix-js-kit-docs-theme');if(t){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();",
  ];
  return { sections, headScripts };
};
