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

describe('scroll-linked depth placement', () => {
	const hero = read('src/components/registry/hero/NovaHeroResponsiveBlock.astro');
	const about = read('src/components/registry/about/AboutExpertBlock.astro');
	const services = read('src/components/registry/services/ServicesHomeBlock.astro');
	const projects = read('src/components/registry/portfolio/ProjectsBlock.astro');
	const timeline = read('src/components/registry/process/ProcessTimelineBlock.astro');
	const footer = read('src/components/registry/shell/NovaFooterBlock.astro');

	it('never puts depth on a container holding running text', () => {
		// Why: parallax moves an element against the page. On body copy that
		// reads as the text sliding — it visibly drifts down when the reader
		// scrolls back up. Depth belongs on media and background layers only.
		// Counting real attributes (with a value) so a passing mention in a
		// comment or a media layer elsewhere in the file does not skew it.
		const attribute = /data-scroll-depth="/g;
		const count = (source: string) => (source.match(attribute) || []).length;

		const mustHaveNone: Array<[string, string]> = [
			['about card body', about],
			['services grid', services],
			['projects grid', projects],
			['education timeline', timeline],
		];

		for (const [label, source] of mustHaveNone) {
			expect(`${label}: ${count(source)}`).toBe(`${label}: 0`);
		}

		// The hero keeps exactly one: the portrait. If a second appears, the
		// text column has picked up parallax again.
		expect(`hero copy column: ${count(hero)}`).toBe('hero copy column: 1');
	});

	it('keeps depth on the hero portrait, which is the media layer', () => {
		expect(hero).toMatch(/data-motion-profile="media"[^>]*data-scroll-depth="-0\.12"/);
		// The text column must not be the carrier.
		expect(hero).not.toMatch(/md:pt-10[^>]*data-scroll-depth=/);
	});

	it('gives the footer photo its own oversized layer with room to drift', () => {
		// The layer must be taller than the footer, otherwise parallax would
		// expose an uncovered edge at the top.
		expect(footer).toMatch(/class="absolute inset-x-0 -top-\[10%\] h-\[120%\][^"]*"[\s\S]*?data-scroll-depth="0\.3"/);
		// And the photo must no longer be a background on <footer> itself,
		// which is what made the copy share the element that moves.
		expect(footer).not.toMatch(/<footer[^>]*style="background-image/);
	});
});
