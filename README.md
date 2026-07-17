# VitePress Open Markdown

VS Code extension to open the currently active markdown file in your running [VitePress](https://vitepress.dev/) dev server.

## Features

- Adds a command and a CodeLens action to open the active markdown file in your browser.
- Converts workspace file paths to the matching VitePress route.
- Supports configuring the target browser app on macOS.

## Install

From GitHub Releases as VSIX file:

1. Go to the [**Releases** page](https://github.com/chgeo/vitepress-open-md/releases) on GitHub.
2. Open the latest release.
3. In **Assets**, download the `.vsix` file.
4. In VS Code, open the Extensions view.
5. Select the `...` menu in the Extensions view.
6. Choose **Install from VSIX...**.
7. Select the downloaded `.vsix` file.

You can also install from the command line:

`code --install-extension /path/to/vitepress-open-md-<version>.vsix`

## Quick Start

1. Start your VitePress dev server.
2. Open a Markdown file in the editor.
3. Run **Open VitePress Markdown in Browser** from the Command Palette
4. Or use the **Open in VitePress** code lens action above any markdown heading.

#### Prerequisites

- A running VitePress site in dev mode.
- A workspace that contains the Markdown file you want to open.

## Detailed Features and Settings

### Commands

- Command title: _Open VitePress Markdown in Browser_
- Command ID: `vitepressMd.openCurrent`

Run it from:

- Command Palette
- Keyboard shortcut (if you assign one)

### CodeLens Action

Example:<br>
<img width="151" height="55" alt="image" src="https://github.com/user-attachments/assets/2242f6b6-fdd2-4b81-82cb-33195b42e2cc" />


### Extension Settings

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

## Development

- Install dependencies: `npm install`
- Compile once: `npm run compile`
- Watch mode: `npm run watch`

## Packaging and Publishing

- Create a VSIX package: `npm run package`
- Publish to Marketplace: `npm run publish`

If needed, bump version automatically:

- Patch: `vsce publish patch`
- Minor: `vsce publish minor`
- Major: `vsce publish major`

## Known Issues

- The extension is designed for VitePress-style routes. If your site has custom routing behavior, generated URLs may differ.

## License

MIT
