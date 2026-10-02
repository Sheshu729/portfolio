// Single source of truth for site / client project configuration.
// Edit THIS file when changing domain.
// Environment domain used during build.
// TODO: replace with your real deploy URL (used for canonical + sitemap).
export const SITE_URL = 'https://sheshu729.github.io';
export const ACTIVE_TEMPLATE = 'nova';

// Personal portfolio, English only. SITE_LOCALE picks the single active locale;
// the homepage language switcher is removed from the navbar.
export const SITE_LOCALE = 'en';

// BUILD_SCOPE — what goes into build (dist/) and what stays dev-only.
// Dev has everything (for prototyping), build is clean per project scope.
// One-page portfolio: only the homepage + 404 survive the build.
export const BUILD_SCOPE = {
  // Allowlist of paths to keep in build. Empty [] = all.
  // 404 is always kept regardless of this list.
  pages: ['/', '/cookies'],
  // Denylist — always removed from dist/ (dev-only, prototypes, demo).
  // Entry matches by first path segment. Dev and QA stay out of production build.
  forceRemove: ['starwind-demo', 'layout-test', 'roofing', 'dev', 'qa'],
  // Whether to clean unused media (images, videos, fonts) from dist/.
  images: true,
};
