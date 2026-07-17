import { describe, test } from 'node:test';
import { expect } from 'chai';
import { slugifyHeading  } from './helpers';

describe('slugifyHeading', () => {
  test('trims and lowercases input', () => {
    expect(slugifyHeading('  Hello World  ')).to.equal('hello-world');
  });

  test('removes markdown-style html and braces content', () => {
    expect(slugifyHeading('Title <Badge /> {#custom-id}')).to.equal('title');
  });

  test('removes inline html tags from heading text', () => {
    expect(slugifyHeading('Intro <em>Very</em> Important <code>API</code>')).to.equal('intro-very-important-api');
  });

  test('removes markdown attributes at the end of headings', () => {
    expect(slugifyHeading('Installation Guide {.lead #install data-track="docs"}')).to.equal('installation-guide');
  });

  test('removes html entities and standalone ampersands', () => {
    expect(slugifyHeading('Fish &amp; Chips & Salsa')).to.equal('fish--chips--salsa');
  });

  test('strips combining diacritics after normalization', () => {
    expect(slugifyHeading('Crème Brûlée à la carte')).to.equal('creme-brulee-a-la-carte');
  });

  test('transliterates sharp s', () => {
    expect(slugifyHeading('Straße')).to.equal('strasse');
  });

  test('removes unsupported punctuation', () => {
    expect(slugifyHeading('Hello, World! #1?')).to.equal('hello-world-1');
  });

  test('converts spaces and underscores to hyphens', () => {
    expect(slugifyHeading('foo_bar baz')).to.equal('foo-bar-baz');
  });

  test('trims leading and trailing hyphens', () => {
    expect(slugifyHeading('  ---Hello World---  ')).to.equal('hello-world');
  });

  test('preserves existing internal hyphens', () => {
    expect(slugifyHeading('foo-bar baz')).to.equal('foo-bar-baz');
  });

  test('can return empty string when all chars are removed', () => {
    expect(slugifyHeading('***')).to.equal('');
  });

});