<img width="140" height="49" alt="logo_header" src="https://github.com/user-attachments/assets/d69237a7-152d-4d10-9b47-6cb96cefb324" />

# Running konaste games on Linux

> [!IMPORTANT]
> YOU MUST HAVE A LEGAL SUBSCRIPTION TO PLAY THESE GAMES. THIS TOOL DOES NOT
> ALTER ANY GAME FILES.

This is a helper tool for running
[コナステ (konaste)](https://p.eagate.573.jp/game/eacloud/re/video/video_top.html)
games on Linux.

Currently, it supports the following games:

- [beatmania IIDX INFINTAS](https://p.eagate.573.jp/game/eacinf/konainf/index.html)
- [SOUND VOLTEX EXCEED GEAR](https://p.eagate.573.jp/game/eacsdvx/konasdvx/index.html)
- [GITADORA](https://p.eagate.573.jp/game/eacgitadora/konagt/index.html)

## How it works

Konaste games authenticate your subscription in the browser, then launch the
game launcher via a custom URL scheme that includes an authorization token.
Since the standalone executable won't run by itself, traditional launchers like
Lutris cannot be used. This tool automates the registration of URL schemes in
Linux desktop environments and provides support for configuring Wine.

## Prerequisites

- Modern Linux distribution with a desktop environment
   - systemd-cat, update-desktop-database, xdg-mime, xdg-open
- [umu-launcher](https://github.com/Open-Wine-Components/umu-launcher)

## Installation

Download the latest release from the
[GitHub releases page](https://github.com/atty303/konaste-linux/releases) and
install it using the following command:

```bash
cp ~/Downloads/konaste-x86_64-unknown-linux-gnu ~/.local/bin/konaste
chmod +x ~/.local/bin/konaste
```

or install it with [ubi](https://github.com/houseabsolute/ubi).

```bash
ubi install -p atty303/konaste-linux -e konaste -i ~/.local/bin
```

## Minimum installation

### beatmania IIDX INFINTAS

1. Run the following command to configure the wine prefix:

```bash
konaste infinitas configure --env.PROTONPATH=GE-Proton10-8
konaste infinitas create
konaste infinitas exec umu-run winetricks ie8
```

2. Download the installer from the
   [official website](https://p.eagate.573.jp/game/infinitas/2/download/index.html)
   (you need to log in to your account).
3. Run the following command to install it:

```bash
konaste infinitas exec umu-run msiexec /i ~/Downloads/infinitas_installer_2022060800.msi
```

4. Run the following command to associate the URL scheme with the game:

```bash
konaste infinitas associate
```

5. Run the following command to open the login page in your browser:

```bash
konaste infinitas login
```

6. After logging in, click the `ゲーム起動` button to launch the game launcher.

7. After the launcher is started, click the `UPDATE` button to update the game.
8. After the update is complete, click the `SETTING` button and set audio output to `WASAPI (共有モード)`(Shared Mode).

> [!NOTE]
> Wine does not support WASAPI Exclusive Mode on `winepulse.drv`(PulseAudio), so you must use Shared Mode.

### GITADORA

1. Download the installer from the
   [official website](https://p.eagate.573.jp/game/eacgitadora/konagt/download/installer.html)
   (you need to log in to your account).
2. Run the following command to install it:

```bash
konaste gitadora install ~/Downloads/GITRADORA_installer.msi
```

- Select the default options during installation.
- This will install the game to `~/.local/state/konaste/gitadora` (you can
  change this by passing the `--wine-prefix` option).

3. Run the following command to open the login page in your browser:

```bash
konaste gitadora login
```

4. After logging in, click the `ゲーム起動` button to launch the game.

## Usage

### `konaste <game> configure`

This command configures the environment for the specified game.

- `konaste infinitas configure --entrypoint launcher`: Runs the game launcher
  when the game is launched.
- `konaste infinitas configure --entrypoint game`: Runs the game directly when
  the game is launched.
- `konaste infinitas configure --run-command <command>`: Specifies the command to run the game.
  `%c` in command will be replaced with the actual windows command.

### `konaste <game> exec <...command>`

This command executes the specified command in the Wine environment of the game.

- `konaste infinitas exec umu-run winetricks <verbs>`: Runs Winetricks with the specified verbs.
- `konaste infinitas exec umu-run winecfg`: Opens the Wine configuration dialog.

## Tips

### Use gamescope

To run the game with Gamescope, you can use the following command to configure the entrypoint and run command:

```bash
konaste infinitas configure --entrypoint game --run-command "gamescope -f -r 120 --mangoapp -- umu-run %c"
```

To revert this configuration, you can run:

```bash
konaste infinitas configure --entrypoint launcher --run-command "umu-run %c"
```

> [!NOTE]
> If `--entrypoint launcher` with gamescope is used, the launcher will run in gamescope but the game itself will not.

## Troubleshooting

### Launching the game fails with code

After clicking the button, do not go back to the previous page. Doing so will
cause the game launch authorization to fail.

## Verified Configurations

### All games

- OS: Bazzite 42 Desktop Edition (KDE Plasma 6)
- Browser: Firefox 140

### beatmania IIDX INFINTAS

- Proton: GE-Proton10-8 (GE-Proton10-9 is failed to install ie8)

### GITADORA

All game functionality has been tested on the following configurations:

- Hardware: LENOVO ThinkCentre M715q
    - CPU: AMD Ryzen 5 PRO 2400GE (8C 3.20 GHz)
    - GPU: AMD Radeon Vega 11 Graphics
    - RAM: 8 GB
- Proton: GE-Proton10-8
- MIDI Drum: Roland TD-1 (USB)

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

If you're not using the compiled binary, the tool cannot determine its own
execution path. You must specify the `--self-path` option when running the
`konaste` command.

## Game technical details

### beatmania IIDX INFINTAS

- Graphics API: Direct3D 9
- Audio API: WASAPI (Shared Mode, Exclusive Mode), ASIO (Hidden feature)
- Native resolution: 1920x1080
- Maximum frame rate: 120 fps

### SOUN VOLTEX EXCEED GEAR

- Graphics API:
- Audio API: WASAPI (Shared Mode, Exclusive Mode), ASIO
- Native resolution: 1920x1080
- Maximum frame rate: 120 fps

### GITADORA

- Graphics API:
   - Media Foundation for video decoding
- Audio API: WASAPI (Shared Mode, Exclusive Mode)
- Native resolution: 1920x1080
- Maximum frame rate: 60 fps
