import { describe, it } from 'node:test';
import { expect } from 'chai';
import { slugifyHeading as slugify  } from './helpers';

describe('slugifyHeading', () => {
  it('trims and lowercases input', () => {
    expect(slugify('  Hello World  ')).to.equal('hello-world');
  });

  it('uses explicit markdown ID when present', () => {
    expect(slugify('Title <Badge /> {#custom-id}')).to.equal('custom-id');
  });

  it('uses explicit markdown ID for heading Foo {#bar}', () => {
    expect(slugify('Foo {#bar}')).to.equal('bar');
  });

  it('removes inline html tags from heading text', () => {
    expect(slugify('Intro <em>Very</em> Important <code>API</code>')).to.equal('intro-very-important-api');
  });

  it('removes markdown attributes at the end of headings', () => {
    expect(slugify('Installation Guide {.lead #install data-track="docs"}')).to.equal('installation-guide');
  });

  it('removes html entities and standalone ampersands', () => {
    expect(slugify('Fish &amp; Chips & Salsa')).to.equal('fish--chips--salsa');
  });

  it('strips combining diacritics after normalization', () => {
    expect(slugify('Crème Brûlée à la carte')).to.equal('creme-brulee-a-la-carte');
  });

  it('transliterates sharp s', () => {
    expect(slugify('Straße')).to.equal('strasse');
  });

  it('removes unsupported punctuation', () => {
    expect(slugify('Hello, World! #1?')).to.equal('hello-world-1');
  });

  it('converts spaces and underscores to hyphens', () => {
    expect(slugify('foo_bar baz')).to.equal('foo-bar-baz');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  ---Hello World---  ')).to.equal('hello-world');
  });

  it('preserves existing internal hyphens', () => {
    expect(slugify('foo-bar baz')).to.equal('foo-bar-baz');
  });

  it('can return empty string when all chars are removed', () => {
    expect(slugify('***')).to.equal('');
  });

});