import { describe, it, expect, beforeAll } from 'vitest';
import * as cheerio from 'cheerio';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AboutExpertBlock from '@components/registry/about/AboutExpertBlock.astro';

// Why: contract test renders the REAL Astro component through
// experimental_AstroContainer (renderToString from astro, pattern from
// services-media-cards-contract.test.ts) and checks the HTML structure with
// Cheerio. This catches regressions a full build would only show later.

let container: AstroContainer;

async function renderBlock(props: Record<string, unknown> = {}): Promise<string> {
  return container.renderToString(AboutExpertBlock, { props });
}

describe('AboutExpertBlock, kontrakt renderowania', () => {
  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renderuje <section> z ui-section, tone page, id i borderem', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('section').length).toBe(1);
    expect($('section').hasClass('ui-section')).toBe(true);
    expect($('section').hasClass('ui-bg-page')).toBe(true);
    expect($('section').attr('id')).toBe('about');
    expect($('section').hasClass('border-t')).toBe(true);
  });

  it('zawiera .ui-container', async () => {
    const $ = cheerio.load(await renderBlock());
    expect($('.ui-container').length).toBe(1);
  });

  describe('karta', () => {
    it('karta ma tokeny brand (border, bg-white, shadow-soft, overflow-hidden)', async () => {
      const $ = cheerio.load(await renderBlock());
      const card = $('.bg-white.shadow-soft');
      expect(card.length).toBe(1);
      expect(card.hasClass('border-brand-dark/10')).toBe(true);
      expect(card.hasClass('overflow-hidden')).toBe(true);
      expect(card.hasClass('rounded-md')).toBe(true);
    });

    it('zawiera zdjęcie workspace-desk obok certyfikatów (bez portretu)', async () => {
      const html = await renderBlock();
      const $ = cheerio.load(html);
      expect(html).toContain('workspace-desk');
      expect(html).not.toContain('sheshadri-v-portrait');
      expect($('[role="img"]').length).toBe(0);
      expect($('[class*="min-h-[380px]"]').length).toBe(0);

      const image = $('img');
      expect(image.length).toBe(1);
      expect(image.attr('alt')?.trim()).toBeTruthy();
      expect(image.attr('width')).toBe('1536');
      expect(image.attr('height')).toBe('864');
      expect(image.attr('loading')).toBe('lazy');
    });

    it('treść siedzi w mierze max-w-5xl z dużym oddechem', async () => {
      const $ = cheerio.load(await renderBlock());
      const measure = $('.mx-auto.max-w-5xl');
      expect(measure.length).toBe(1);
      const pad = $('.px-8.py-14');
      expect(pad.length).toBe(1);
      expect(pad.hasClass('sm:py-20')).toBe(true);
      expect(pad.hasClass('lg:py-24')).toBe(true);
      expect(pad.hasClass('lg:px-16')).toBe(true);
    });

    it('układ jest dwukolumnowy: zdjęcie z lewej, certyfikaty z prawej', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.lg\\:grid-cols-2').length).toBe(1);
      expect($('figure').length).toBe(1);
    });
  });

  describe('treść eksperta', () => {
    it('renderuje eyebrow (accent-label), h2 z imieniem i lead z rolą', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.ui-type-accent-label').text()).toContain('ABOUT ME');
      expect($('h2').length).toBe(1);
      expect($('h2').text()).toContain('Sheshadri V');
      expect($('.ui-type-lead').text()).toContain('Electronics');
    });

    it('nie renderuje akapitu bio (zastąpiony zdjęciem)', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.ui-type-body').length).toBe(0);
    });
  });

  describe('certyfikaty', () => {
    it('renderuje etykietę CERTIFICATIONS i co najmniej 2 karty certyfikatów', async () => {
      const $ = cheerio.load(await renderBlock());
      expect($('.ui-type-accent-label').text()).toContain('CERTIFICATIONS');
      const cards = $('li[class*="bg-brand-primary/5"]');
      expect(cards.length).toBeGreaterThanOrEqual(2);
      expect(cards.text()).toContain('Hackathon INNOVATEX 2025');
      expect(cards.text()).toContain('Certificate Internship Training Programme in IoT');
    });

    it('karty certyfikatów mają ✓ w kolorze accent i ramkę', async () => {
      const $ = cheerio.load(await renderBlock());
      const cards = $('li[class*="bg-brand-primary/5"]');
      cards.each((_, el) => {
        expect($(el).hasClass('border-brand-dark/10')).toBe(true);
        expect($(el).children('span').first().hasClass('text-brand-accent')).toBe(true);
        expect($(el).text()).toContain('✓');
      });
    });
  });

  describe('checki', () => {
    it('renderuje checki z ✓ w kolorze accent', async () => {
      const $ = cheerio.load(await renderBlock());
      const items = $('ul li');
      expect(items.length).toBeGreaterThanOrEqual(3);
      items.each((_, el) => {
        expect($(el).children('span').first().hasClass('text-brand-accent')).toBe(true);
        expect($(el).text()).toContain('✓');
      });
    });
  });

  describe('tagi umiejętności', () => {
    it('renderuje co najmniej 3 tagi z tłem bg-brand-primary/10', async () => {
      const $ = cheerio.load(await renderBlock());
      const tags = $('span.text-brand-primary');
      expect(tags.length).toBeGreaterThanOrEqual(3);
      tags.each((_, el) => {
        expect($(el).hasClass('bg-brand-primary/10')).toBe(true);
        expect($(el).hasClass('rounded-sm')).toBe(true);
      });
    });

    it('tagi pokazują języki i narzędzia (HTML5, JavaScript, TypeScript, Python)', async () => {
      const $ = cheerio.load(await renderBlock());
      const tagTexts = $('span.text-brand-primary')
        .map((_, el) => $(el).text().trim())
        .get();
      expect(tagTexts).toContain('HTML5');
      expect(tagTexts).toContain('TypeScript');
      expect(tagTexts).toContain('Python');
    });
  });

  describe('linki zewnętrzne', () => {
    it('renderuje LinkedIn i GitHub z target blank i rel noreferrer', async () => {
      const $ = cheerio.load(await renderBlock());
      const links = $('a[target="_blank"]');
      expect(links.length).toBe(2);

      const hrefs = links
        .map((_, el) => $(el).attr('href'))
        .get();
      expect(hrefs[0]).toContain('linkedin.com');
      expect(hrefs[1]).toContain('github.com/Sheshu729');

      links.each((_, el) => {
        expect($(el).attr('rel')).toContain('noreferrer');
      });
    });
  });

  describe('i18n (pl/en)', () => {
    it('EN renderuje angielskie treści', async () => {
      const $ = cheerio.load(await renderBlock({ locale: 'en' }));
      expect($('.ui-type-accent-label').text()).toContain('ABOUT ME');
      expect($('h2').text()).toContain('Sheshadri V');
      expect($('.ui-type-lead').text()).toContain('Electronics');
      expect($('figure img').attr('alt')).toContain('Developer desk');
    });

    it('props data nadpisują JSON (wzorzec "props || json")', async () => {
      const custom = {
        pl: {
          eyebrow: 'Custom eyebrow',
          name: 'Anna Przykładowa',
          role: 'Konsultantka',
          image: '/assets/images/custom.webp',
          imageAlt: 'Custom photo',
          certificationsLabel: 'CERTYFIKATY',
          certifications: ['Certyfikat A'],
          checks: ['Punkt A', 'Punkt B', 'Punkt C'],
          tags: ['Alfa', 'Beta', 'Gamma'],
          linkedinLabel: 'in',
          linkedinName: 'LinkedIn',
          linkedinUrl: 'https://linkedin.com/company/example/',
        },
      };
      const $ = cheerio.load(await renderBlock({ data: custom }));
      expect($('h2').text()).toContain('Anna Przykładowa');
      expect($('.ui-type-accent-label').text()).toContain('Custom eyebrow');
      expect($('a[target="_blank"]').first().attr('href')).toContain('linkedin.com/company/example');
      expect($('a[target="_blank"]').length).toBe(1);
      expect($('figure img').attr('alt')).toBe('Custom photo');
      expect($('li[class*="bg-brand-primary/5"]').length).toBe(1);
    });
  });

  it('nie zawiera data-reveal ani danych osobowych klienta', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('data-reveal');
    expect(html).not.toContain('Piotr');
    expect(html).not.toContain('Kowalczyk');
    expect(html).not.toContain('client-specific');
    expect(html).not.toContain('piotrkowalczyk');
  });

  it('nie zawiera klienckich tokenów CSS', async () => {
    const html = await renderBlock();
    expect(html).not.toContain('border-outline');
    expect(html).not.toContain('bg-brand-cream');
    expect(html).not.toContain('--color-primary-container');
  });
});
