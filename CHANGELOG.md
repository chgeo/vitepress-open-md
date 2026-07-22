# Change Log

All notable changes to the "VitePress Open MD" extension are documented in this file.

## [Unreleased]

## [0.4.0] - 2026-07-22

- Added `vitepressMd.vsCodeCompatibleSlugs` setting to match VS Code's format for turning headings into links (for example, 'Node.js' links to '#nodejs' instead of the standard '#node-js').
- The CodeLens action above Markdown/MDX headings is now opt-in via `vitepressMd.enableCodeLens` (default: `false`).

## [0.3.0] - 2026-07-20

- Added an editor title-bar action (with icon) for Markdown and MDX files.
- Added editor title overflow and Explorer context menu entries for quick access.
- Fixed Explorer invocation so the selected file is opened instead of always using the active editor.
- Added a dedicated extension icon for Marketplace listing.

## [0.2.4] - 2026-07-20

- Improved heading slug generation for CAP documentation patterns, including emphasized filenames, explicit IDs with preserved underscores, and backticked property paths containing HTML-tagged placeholders such as `cds.requires.<i>\<srv\></i>`.service.

## [0.2.3] - 2026-07-17

- Fixed heading anchor ID extraction to tolerate whitespace inside the braces, e.g. `Foo { #bar }` now correctly uses `bar` as the slug.

## [0.2.2] - 2026-07-17

- Added a tooltip to the Markdown/MDX heading quick action that shows the VitePress target URL prefix.
- Improved heading quick action responsiveness by reducing per-heading tooltip computation.

## [0.2.1] - 2026-07-17

- Honor explicit Markdown heading IDs (for example, `Foo {#bar}` now uses `bar` as the slug/anchor).

## [0.2.0] - 2026-07-17

- Added a quick action above each Markdown and MDX heading in the editor. The quick action opens the current section directly in VitePress.

## [0.1.0] - 2026-07-16

- Initial release.
- Added command to open the active Markdown file in the VitePress dev server.
- Added settings for base URL, VitePress root folder, browser app, and optional anchor.
