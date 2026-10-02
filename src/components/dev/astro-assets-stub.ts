// Why: `astro:assets` is a virtual module provided by Astro's build pipeline.
// Contract tests render components without that pipeline, so vitest aliases the
// bare specifier (vitest.config.ts) to this stub. The component under test uses
// its own public-image fallback for the string paths asserted here, so these
// exports are never rendered by this test.
export function Image(): null {
  return null;
}

export function Picture(): null {
  return null;
}
