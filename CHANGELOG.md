# Change Log

All notable changes to the "VitePress Open MD" extension are documented in this file.

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
