import { describe, it } from 'node:test';
import { expect } from 'chai';
import { slugifyHeading as slugify  } from './url';

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

  it('preserves underscores in explicit markdown IDs', () => {
    expect(slugify('Services {#vcap_services}')).to.equal('vcap_services');
  });

  it('uses explicit markdown ID with surrounding whitespace { #bar. }', () => {
    expect(slugify('Foo { #bar }')).to.equal('bar');
  });

  it('ignores markdown emphasis around .env in headings', () => {
    expect(slugify('In _.env_ Files for Local Testing')).to.equal('in-env-files-for-local-testing');
  });

  it('preserves dotted filename segment boundaries inside markdown emphasis', () => {
    expect(slugify('Through _.cdsrc-private.json_ File for Hybrid Testing')).to.equal('through-cdsrc-private-json-file-for-hybrid-testing');
  });

  it('preserves dotted segments around escaped angle-bracket placeholders inside html tags', () => {
    expect(slugify('cds.requires.<i>\\<srv\\></i>.credentials')).to.equal('cds-requires-srv-credentials');
  });

  it('preserves dotted segments after closing html tags around escaped angle-bracket placeholders', () => {
    expect(slugify('cds.requires.<i>\\<srv\\></i>.service')).to.equal('cds-requires-srv-service');
  });

  it('preserves dotted segments for backticked CAP docs property headings', () => {
    expect(slugify('`cds.requires.<i>\\<srv\\></i>`.service')).to.equal('cds-requires-srv-service');
    expect(slugify('`cds.requires.<i>\\<srv\\></i>`.impl')).to.equal('cds-requires-srv-impl');
    expect(slugify('`cds.requires.<i>\\<srv\\></i>`.kind')).to.equal('cds-requires-srv-kind');
    expect(slugify('`cds.requires.<i>\\<srv\\></i>`.model')).to.equal('cds-requires-srv-model');
    expect(slugify('`cds.requires.<i>\\<srv\\></i>`.credentials')).to.equal('cds-requires-srv-credentials');
  });

  it('slugifies the CAP docs property headings for impl, kind, model, and credentials', () => {
    expect(slugify('cds.requires.<i>\\<srv\\></i>.impl')).to.equal('cds-requires-srv-impl');
    expect(slugify('cds.requires.<i>\\<srv\\></i>.kind')).to.equal('cds-requires-srv-kind');
    expect(slugify('cds.requires.<i>\\<srv\\></i>.model')).to.equal('cds-requires-srv-model');
    expect(slugify('cds.requires.<i>\\<srv\\></i>.credentials')).to.equal('cds-requires-srv-credentials');
  });

  it('slugifies additional CAP docs headings as expected', () => {
    expect(slugify('cds. connect.to () {.method}')).to.equal('cds-connect-to');
    expect(slugify('Through `process.env` Variables {#bindings-via-process-env}')).to.equal('bindings-via-process-env');
    expect(slugify('In Kubernetes / Kyma { #in-kubernetes-kyma}')).to.equal('in-kubernetes-kyma');
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