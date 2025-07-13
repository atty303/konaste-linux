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

## Minimum steps to run the games

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

**This guide is outdated. Need to be updated.**

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

### `konaste <game> create`

This command creates a Wine prefix for the specified game.
You must configure the prefix with the `configure` command before running this command.

### `konaste <game> associate`

This command registers the URL scheme for the specified game in the desktop environment.
It allows you to launch the game from the browser.

### `konaste <game> exec <...command>`

This command executes the specified command in the Wine prefix of the game.

- `konaste infinitas exec umu-run winetricks <verbs>`: Runs Winetricks with the specified verbs.
- `konaste infinitas exec umu-run winecfg`: Opens the Wine configuration dialog.

### `konaste <game> run <url>`

This command is executed by the URL scheme registered by the `associate` command.
It runs the game in GUI session, so logs are output to the systemd journal.

### `konaste <game> login`

This command opens the login page of the specified game in your default web browser.

## Tips

### Use gamescope

To run the game with [gamescope](https://github.com/ValveSoftware/gamescope), you can use the following command to configure the entrypoint and run command:

```bash
konaste infinitas configure --entrypoint game --run-command "gamescope --rt -f -r 120 --filter linear --mangoapp -- umu-run %c"
```

> [!NOTE]
> This configuration runs smoothly on my system without any stuttering or tearing.

To revert this configuration when update is required, you can run:

```bash
konaste infinitas configure --entrypoint launcher --run-command "umu-run %c"
```

> [!NOTE]
> If `--entrypoint launcher` with gamescope is used, the launcher will run in gamescope but the game itself will not.

### Low latency audio setup

- Use [PipeWire](https://www.google.com/search?client=firefox-b-d&q=pipewire) as the audio server for low latency audio with flexible routing and compatibility.

Configure linux side audio settings for low latency audio:

`~/.config/pipewire/pipewire.conf.d/90-low-latency.conf`:
```
context.properties = {
  default.clock.rate = 48000

  # INFINITAS requires 44100Hz, allow both rates.
  # If possible, switch the entire graph to 44.1 kHz to suppress resampling.
  default.clock.allowed-rates = [ 44100, 48000 ]

  # Reducing it lowers latency, but increases CPU load and makes the audio more prone to dropouts.
  default.clock.quantum = 32
  default.clock.min-quantum = 32
  # Set it to twice the minimum.
  default.clock.max-quantum = 64
  default.clock.quantum-limit = 64
}

context.modules = [
  {
    name = libpipewire-module-rt
    args = {
      nice.level = -20
      rt.prio = 99
    }
  }
]
```

Configure a dedicated virtual audio device for games:

`~/.config/pipewire/pipewire.conf.d/90-infinitas.conf`:
```
context.modules = [
  {
    name = libpipewire-module-loopback
    args = {
      node.description = "INFINITAS Loopback"
      audio.position = [ FL FR ]
      capture.props = {
        node.name = "infinitas-sink"
        media.class = "Audio/Sink"
        node.description = "INFINITAS Sink"
        device.description = "INFINITAS Sink"
        device.class = "sound"
        device.icon-name = "audio-card"
        node.virtual = false
        # IMPORTANT: Set the sample rate to 44100Hz for compatibility with INFINITAS.
        audio.rate = 44100
        audio.channels = 2
      }
      playback.props = {
        node.name = "infinitas-output"
        node.passive = true
        target.object = "alsa_output.pci-0000_c4_00.6.analog-stereo"

        # stereo to 7.1ch upmixing, unless delete below.
        stream.dont-remix = true
        audio.position = [ FL FR RL RR FC LFE SL SR ]
        channelmix.upmix = true
        channelmix.upmix-method = "psd"
        channelmix.lfe-cutoff = 150
        channelmix.fc-cutoff = 12000
        channelmix.rear-delay = 12.0
        channelmix.stereo-widen = 0.1
      }
    }
  }
]
```

Apply the configuration by running:

```bash
systemctl --user restart pipewire pipewire-pulse
```

Configure the game to use the virtual audio device, run `winecfg` to set the audio output device to `INFINITAS Loopback`.

```bash
konaste infinitas exec umu-run winecfg
```

Configure the game side audio buffer size to reduce latency:

```bash
konaste infinitas configure --env.PULSE_LATENCY_MSEC=60
```

Lowering the value will reduce latency, but may cause audio dropouts if your system cannot handle it.

#### Refrences

Since I was new to Linux’s audio system, I referred to the following.

- https://www.reddit.com/r/linux_gaming/comments/1gao420/low_latency_guide_for_linux_using_pipewire/
- https://blog.thepoon.fr/osuLinuxAudioLatency/
- https://www.benashby.com/resources/pipewire-virtual-devices/
- https://forum.manjaro.org/t/howto-troubleshoot-crackling-in-pipewire/82442

## Troubleshooting

### Launching the game fails

After clicking the launch button, do not go back to the previous page. Doing so will
cause the game launch authorization to fail.

### INFIINITAS does not play sound

- You need to set the audio output to `WASAPI (共有モード)` (Shared Mode) in the game settings.
- You need to provide audio output device that configured sample rate to 44100Hz.

## Verified Configurations

### All games

- OS: Bazzite 42 Desktop Edition (KDE Plasma 6)
- Browser: Firefox 140

### beatmania IIDX INFINTAS

All game functionality has been tested on the following configurations:

- Hardware: Minisforum UM790 Pro
    - CPU: AMD Ryzen 9 7940HS (8C / 4.0 - 5.2 GHz)
    - GPU: AMD Radeon 780M
    - RAM: 64 GB
- Audio: Sennheiser GSX1000 (7.1ch Virtual Surround)
- Display:
   - Primary: Hisense 43E7N 4K @120Hz via HDMI
   - Secondary: Full HD Monitor @60Hz via USB-C
- Controller: GAMO2 PHOENIXWAN+ LMT x2
- Proton: GE-Proton10-8 (GE-Proton10-9 is failed to install ie8)

CPU load is around 10% and GPU load is around 70% during gameplay and streaming with OBS Studio.
There’s no noticeable difference compared to running it on Windows 11 in a dual-boot setup.

### SOUND VOLTEX EXCEED GEAR

:under_construction:

### GITADORA

All game functionality has been tested on the following configurations:

- Hardware: LENOVO ThinkCentre M715q
    - CPU: AMD Ryzen 5 PRO 2400GE (4C / 3.2 - 3.8 GHz)
    - GPU: AMD Radeon Vega 11 Graphics
    - RAM: 8 GB
- Audio: Onboard
- Proton: GE-Proton10-8
- MIDI Drums: Roland TD-1 (USB)

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
  - Requires 44100Hz sample rate
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
