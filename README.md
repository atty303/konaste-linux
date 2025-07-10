# Running konaste games on Linux

This is a helper tool for running konaste games on Linux.

## Prerequisites

I'm using Bazitte Linux. This distribution can run games out of the box.

- umu-launcher

## Installation

```bash
deno install -A --global konaste
```

## Usage

### GITADORA

1. Download the installer from the official website.
2. Run the following command to install it:
```bash
konaste gitadora ~/Downloads/GITRADORA_installer.msi
```
   - Select the default options during installation.
   - This will install the game to `~/Games/gitadora`.
3. Launch the game from web browser.

> [!WARNING]
> After the launch completes, do not back to the previous page. It will cause failed to authorize the game launch.

## Troubleshooting

### GITADORA

- If update process fails, try different Proton versions.