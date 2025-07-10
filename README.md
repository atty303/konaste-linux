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
> After the launch completes, do not back to the previous page. It will cause
> failed to authorize the game launch.

## Troubleshooting

### GITADORA

- If the update process fails, try different Proton versions.

## Development

### Requirements

1. Activate [mise](https://mise.jdx.dev/).
2. Run `mise install` to install dependencies.
3. Run `hk install` to install the git hooks for formatting and linting.

### Local Development

To install the tool from source, run the following command:

```bash
deno install -A --global -n konaste --config ./deno.jsonc src/main.ts
```

If you were not using compiled binary, can't probe how to run the tool from tool itself.
You must specify the `--self-path` option to the installed `konaste` command.
