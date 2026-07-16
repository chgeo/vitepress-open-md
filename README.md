# VitePress Open Markdown

VS Code extension to open the currently active markdown file in your running [VitePress](https://vitepress.dev/) dev server.

## Features

- Adds a command to open the active markdown file in your browser.
- Converts workspace file paths to the matching VitePress route.
- Supports an optional anchor fragment.
- Supports configuring the target browser app on macOS.

## Command

- Command title: _Open VitePress Markdown in Browser_
- Command ID: `vitepressMd.openCurrent`

Run it from:

- Command Palette
- Keyboard shortcut (if you assign one)

## Extension Settings

This extension contributes the following settings:

- `vitepressMd.baseUrl`
  - Default: http://localhost:5173
  - Base URL of your running VitePress dev server.
- `vitepressMd.rootFolder`
  - Default: docs
  - Workspace folder containing your VitePress root.
- `vitepressMd.browserApp`
  - Default: Google Chrome
  - macOS app name used to open/reuse browser tabs.
- `vitepressMd.anchor`
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

`npm install`

Compile once:

`npm run compile`

Watch mode:

`npm run watch`

## Packaging and Publishing

Create a VSIX package:

`npm run package`

Publish to Marketplace:

`npm run publish`

If needed, bump version automatically:

- Patch: `vsce publish patch`
- Minor: `vsce publish minor`
- Major: `vsce publish major`

## Known Issues

- The extension is designed for VitePress-style routes. If your site has custom routing behavior, generated URLs may differ.

## License

MIT
