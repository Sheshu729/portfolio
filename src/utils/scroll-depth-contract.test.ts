import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.resolve(root, file), 'utf8');

const depth = read('public/js/scroll-depth.js');
const motion = read('public/js/motion.js');
const styles = read('src/styles/motion.css');
const layout = read('src/layouts/Layout.astro');

describe('scroll-linked depth contract', () => {
	it('is a separate engine so the reveal stays observer-only', () => {
		// Why: motion.js is the reveal contract and must never own a scroll
		// listener. Depth is a different job with a different lifetime.
		expect(motion).not.toContain("addEventListener('scroll'");
		expect(depth).toContain("window.addEventListener('scroll', onScroll, { passive: true })");
		expect(layout).toContain('src="/js/scroll-depth.js"');
		expect(layout).toContain('data-astro-rerun');
	});

	it('guards the loop: single instance, one write per frame, work gated to viewport', () => {
		expect(depth).toContain('if (window.__novaScrollDepth) return;');
		expect(depth).toContain('if (!item.visible) continue;');
		expect(depth).toContain('if (rafId) return;');
		expect(depth).toContain('requestAnimationFrame');
		// Passive listener: it must never be able to block scrolling.
		expect(depth).not.toContain('preventDefault');
		expect(depth).toMatch(/addEventListener\('scroll', onScroll, \{ passive: true \}\)/);
	});

	it('bails on reduced motion and when motion is disabled', () => {
		expect(depth).toContain("'(prefers-reduced-motion: reduce)'");
		expect(depth).toContain('if (isDisabled() || isReduced()) return;');
		expect(depth).toContain("hasAttribute('data-motion-disabled')");
	});

	it('clamps the offset so a fast flick cannot strand an element', () => {
		expect(depth).toContain('if (shift > limit) shift = limit;');
		expect(depth).toContain('else if (shift < -limit) shift = -limit;');
		expect(styles).toContain('--scroll-depth-max:');
	});

	it('composes depth into the reveal translate instead of fighting it', () => {
		// Reveal start state travels from its current on-screen position.
		expect(styles).toContain('translate: 0 calc(var(--motion-distance) + var(--scroll-depth-y, 0px));');
		// Settled state keeps tracking scroll.
		expect(styles).toMatch(/\[data-motion="fade"\]\[data-motion-visible\][\s\S]*?translate: 0 var\(--scroll-depth-y, 0px\);/);
		// Skip opts out of the reveal only, not out of depth.
		expect(styles).toContain('[data-motion-skip][data-scroll-depth]');
		// A depth element must not ease translate, or it lags the scroll.
		expect(styles).toMatch(/\[data-scroll-depth\]\[data-motion-visible\][\s\S]*?color 250ms cubic-bezier\(0\.33, 1, 0\.68, 1\) 0ms !important;/);
	});

	it('re-initialises across view transitions', () => {
		expect(depth).toContain("document.addEventListener('astro:before-swap', reset)");
		expect(depth).toContain("document.addEventListener('astro:after-swap', schedule)");
		expect(depth).toContain("document.addEventListener('astro:page-load', schedule)");
	});
});
