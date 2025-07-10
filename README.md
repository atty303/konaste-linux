<img width="140" height="49" alt="logo_header" src="https://github.com/user-attachments/assets/d69237a7-152d-4d10-9b47-6cb96cefb324" />

# Running konaste games on Linux

This is a helper tool for running [コナステ(konaste)](https://p.eagate.573.jp/game/eacloud/re/video/video_top.html)
games on Linux.

Currently, it supports the following games:

- [GITADORA](https://p.eagate.573.jp/game/eacgitadora/konagt/index.html)

> [!IMPORTANT]
> YOU MUST HAVE A LEGAL SUBSCRIPTION TO PLAY THESE GAMES. THIS TOOL DOES NOT ALTER ANY GAME FILES.

## How it works

Konaste games authenticate your subscription in the browser, then launch the game launcher via a custom URL scheme that
includes an authorization token. Because the standalone executable won’t run by itself, launchers like Lutris cannot be
used. This tool automates registering URL schemes in a Linux desktop environment and also provides support for
configuring Wine.

## Prerequisites

- [umu-launcher](https://github.com/Open-Wine-Components/umu-launcher)

## Installation

Download the latest release from the [GitHub releases page](https://github.com/atty303/konaste-linux/releases) and
install it using the following command:

```bash
cp ~/Downloads/konaste-x86_64-unknown-linux-gnu ~/.local/bin/konaste
chmod +x ~/.local/bin/konaste
```

## Usage

### GITADORA

1. Download the installer from
   the [official website](https://p.eagate.573.jp/game/eacgitadora/konagt//download/installer.html) (You need to log in
   to your account).
2. Run the following command to install it:

```bash
konaste gitadora install ~/Downloads/GITRADORA_installer.msi
```

- Select the default options during installation.
- This will install the game to `~/.local/state/konaste/gitadora` (you can change this by passing the `--wine-prefix`
  option).

3. Run the following command to open the login page in your browser:

```bash
konaste gitadora login
````

4. After logging in, click the `ゲーム起動` button to launch the game.

> [!WARNING]
> After the button clicked, do not back to the previous page. It will be
> failed to authorize the game launch.

### Verified Configurations

- Hardware: LENOVO ThinkCentre M715q
    - CPU: AMD Ryzen 5 PRO 2400GE (8C 3.20 GHz)
    - GPU: AMD Radeon Vega 11 Graphics
    - RAM: 8 GB
- OS: Bazzite 42 Desktop Edition (KDE Plasma 6)
- Browser: Firefox 140
- Proton: GE-Proton10-8
- MIDI Drum: Roland TD-1 (USB)

## Troubleshooting

### GITADORA

- If the update process fails, try different Proton versions.

## Development

### Requirements

1. Activate [mise](https://mise.jdx.dev/).
2. Run `mise install` to install dependencies.
3. Run `hk install --mise` to install the git hooks for formatting and linting.

### Local Development

To install the tool from source, run the following command:

```bash
deno install -A --global -n konaste --config ./deno.jsonc src/main.ts
```

If you were not using compiled binary, can't probe how to run the tool from tool itself.
You must specify the `--self-path` option to the installed `konaste` command.
