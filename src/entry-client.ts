// ============================================================================
// Client entry — hydrate islands
// ============================================================================

import { hydrateIslands } from "@deijose/nix-js-kit/island";
import { startClientRouter } from "@deijose/nix-js-kit/router";

import ThemeToggle from "./islands/ThemeToggle";
import Search from "./islands/Search";
import MobileDrawer from "./islands/MobileDrawer";
import CodeCopy from "./islands/CodeCopy";

hydrateIslands({
  ThemeToggle,
  Search,
  MobileDrawer,
  CodeCopy,
});

// Start the SPA client router for navigation between doc pages
startClientRouter();
