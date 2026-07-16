# VitePress Open MD

Open the currently active Markdown file in your running VitePress dev server.

## Features

- Adds a command to open the active Markdown file in your browser.
- Converts workspace file paths to the matching VitePress route.
- Supports an optional anchor fragment.
- Supports configuring the target browser app on macOS.

## Command

- Command title: Open VitePress Markdown in Browser
- Command ID: vitepressOpenCurrent.openCurrent

Run it from:

- Command Palette
- Keyboard shortcut (if you assign one)

## Extension Settings

This extension contributes the following settings:

- vitepressOpenCurrent.baseUrl
  - Default: http://localhost:5173
  - Base URL of your running VitePress dev server.
- vitepressOpenCurrent.rootFolder
  - Default: docs
  - Workspace folder containing your VitePress root.
- vitepressOpenCurrent.browserApp
  - Default: Google Chrome
  - macOS app name used to open/reuse browser tabs.
- vitepressOpenCurrent.anchor
  - Default: (empty)
  - Optional hash fragment to append, for example: installation

## Requirements

- A running VitePress site in dev mode.
- A workspace that contains the Markdown file you want to open.

## Quick Start

1. Start your VitePress dev server.
2. Open a Markdown file in the editor.
3. Run Open VitePress Markdown in Browser from the Command Palette.

## Development

Install dependencies:

npm install

Compile once:

npm run compile

Watch mode:

npm run watch

## Packaging and Publishing

Create a VSIX package:

vsce package

Publish to Marketplace:

vsce publish

If needed, bump version automatically:

- Patch: vsce publish patch
- Minor: vsce publish minor
- Major: vsce publish major

## Known Issues

- The extension is designed for VitePress-style routes. If your site has custom routing behavior, generated URLs may differ.

## License

MIT
