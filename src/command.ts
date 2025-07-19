import * as path from "jsr:@std/path";
import * as pathWin from "jsr:@std/path/windows";
import xdg from "@404wolf/xdg-portable";
import { colors } from "@cliffy/ansi/colors";
import { Command, ValidationError } from "@cliffy/command";
import { GameConfig, readConfig, tryReadConfig, writeConfig } from "./config.ts";
import $ from "@david/dax";
import * as reg from "./winereg.ts";
import { readRegistryFile } from "./winereg.ts";
import { GameDefinition } from "./games.ts";

function configCommand(def: GameDefinition) {
  return new Command()
    .description("Set configuration for the game")
    .option("--env.* [value:string]", "Set environment variable (empty value to unset)")
    .option("--run-profile [name:string]", "Run profile to use")
    .example("Show current configuration", "konaste game config")
    .example("Set environment variables", "konaste game config --env WINEPREFIX=/path/to/prefix")
   .action(async (options) => {
      const defaultConfig = {
        env: {
          WINEPREFIX: path.join(xdg.state(), "konaste", def.id),
          GAMEID: `umu-${def.id}`,
        },
        profiles: def.profiles,
        runProfile: undefined,
      };
      const config0 = {
        ...defaultConfig,
        ...(await tryReadConfig(def.id) ?? {}),
      };
     const config = {
        ...config0,
        env: {
          ...config0.env,
          ...options.env,
        } as Record<string, string>,
        runProfile: config0.runProfile ?? (options.runProfile === true ? undefined : options.runProfile),
      };
      for (
        const [key, _] of Object.entries(options.env ?? {}).filter((
          [_, value],
        ) => value === true)
      ) {
        delete config.env[key];
      }

     $.log(JSON.stringify(config, null, 2));
     if (Object.keys(options).length === 0) {
       Deno.exit(0);
      }

     await writeConfig(def.id, config);
      $.logStep(`Configuration for ${def.id} saved`);
    });
}

function profileCommand(def: GameDefinition) {
  return new Command()
    .description(`Manage launch profiles for the game

command string supports the following placeholders:
  %u: URL passed to the game
  %t: Token from the URL
  %r: Installation directory as windows format (e.g. C:\\Games)
  %{id}: Game ID (e.g. 'infinitas', 'sdvx', etc.)
    `)
    .option("--default", "Set this profile as the default")
    .option("--command <command:string>", `Set the launch command for the profile`)
    .option("--delete", "Delete the profile")
    .arguments("[name:string]")
    .example("List all profiles", "konaste game profile")
    .example("Unset the default profile", "konaste game profile --default")
    .action(async (options, name) => {
      const config = await readConfig(def.id);

      if (Object.keys(options).length === 0) {
        $.log("Available profiles:");
        for (const [name, profile] of Object.entries(def.profiles)) {
          const isDefault = config.runProfile === name;
          $.log(
            `${isDefault ? `$${colors.green(name)} (default)` : colors.yellow(name)}: ${profile.command}`,
          );
        }
        return;
      }

      if (options.delete && name) {
        delete config.profiles[name];
      } else if (options.command && name) {
        config.profiles[name].command = options.command;
      }

      if (options.default) {
        config.runProfile = name;
      }

      await writeConfig(def.id, config);
      $.logStep(`Configuration for ${def.id} saved`);
    });
}

async function extractIcon(
  def: GameDefinition,
  config: GameConfig,
  dest: string,
): Promise<void> {
  const systemReg = await readRegistryFile(
    path.join(config.env.WINEPREFIX, "system.reg"),
  );

  const [pathInWin, index] = await (() => {
    const iconValue = reg.findValue(
      systemReg,
      `Software\\Classes\\${def.urlScheme}\\DefaultIcon`,
      "",
    );
    if (iconValue && iconValue.type === "REG_SZ") {
      const [path, index] = iconValue.data.split(",");
      return [path, parseInt(index, 10)] as const;
    } else {
      return [undefined, undefined] as const;
    }
  })();

  $.logLight(`Icon path in Windows: ${pathInWin}, icon index: ${index}`);
  if (!pathInWin) {
    throw new Error(`No icon found for ${def.urlScheme} in registry`);
  }

  const parsedPathWin = pathWin.parse(pathInWin);
  const drive = parsedPathWin.root[0].toLowerCase();
  const pathUnixInDrive = path.fromFileUrl(pathWin.toFileUrl(pathWin.format({
    dir: `\\${parsedPathWin.dir.replace(parsedPathWin.root, "")}`,
    base: parsedPathWin.base,
  })));

  const absPath = path.join(
    config.env.WINEPREFIX,
    `drive_${drive}`,
    pathUnixInDrive,
  );
  $.logLight(`Absolute path to icon: ${absPath}`);

  const name = `${absPath}[${index}]`;
  await $`magick ${name} ${dest}`.printCommand();
}

function associateCommand(def: GameDefinition) {
  return new Command()
    .description(`Associate the URL scheme "${def.urlScheme}://" with the game`)
    .option("--self-path <path:file>", "Path to the this executable")
    .action(async (options) => {
      // If run as a Deno script, require the --self-path option
      const selfPath = Deno.execPath().includes("deno")
        ? options.selfPath
        : Deno.execPath();
      if (!selfPath) {
        throw new Error("--self-path is required");
      }

      const config = await readConfig(def.id);

      $.logStep(`Extracting icon for ${def.id}`);
      const iconName = await (async () => {
        try {
          const dest = path.join(xdg.data(), "icons", `${def.id}.png`);
          await extractIcon(def, config, dest);
          return def.id;
        } catch (err) {
          $.logWarn(
            `Failed to extract icon. Your desktop entry may not have an icon: ${err}`,
          );
        }
      })();

      const dir = await Deno.makeTempDir();
      try {
        const filename = `${def.id}.desktop`;

        const mimeType = `x-scheme-handler/${def.urlScheme}`;
        const desktopPath = path.join(dir, filename);

        const body = `[Desktop Entry]
Name=${def.name}
Name[ja]=${def.nameJA}
Exec=${selfPath} ${def.id} run %u
Type=Application
Categories=Game;
Terminal=false
StartupNotify=true
MimeType=${mimeType};
${iconName ? `Icon=${iconName}` : ""}`;
        $.logLight(`Desktop entry content:\n${body}`);
        await $.path(desktopPath).writeText(body);

        $.log("Installing desktop entry");
        const applicationPath = path.join(
          xdg.data(),
          "applications",
        );
        await $`desktop-file-install --dir=${applicationPath} --delete-original --rebuild-mime-info-cache ${desktopPath}`
          .printCommand();
      } finally {
        await Deno.remove(dir, { recursive: true });
      }
      //      await $`xdg-mime default ${filename} ${mimeType}`.printCommand();

      $.logStep("Successfully created desktop entry");
    });
}

function execCommand(def: GameDefinition) {
  return new Command()
    .description("Run a command in same environment as the `run` subcommand")
    .arguments("<...command:string>")
    .action(async (_, ...command) => {
      const config = await readConfig(def.id);
      await $.raw`${command.join(" ")}`.env(config.env).printCommand();
    });
}

function runCommand(def: GameDefinition) {
  return new Command()
    .description(
      "Open the login page in a browser if url is not provided, otherwise run the game with the given URL",
    )
    .arguments("[url:string]")
    .error(async (error, cmd) => {
      if (error instanceof ValidationError) {
        cmd.showHelp();
        Deno.exit(1);
      }

      // This command is expected to be run from a desktop entry, so notify the user
      await $`notify-send --app-name ${cmd.getName()} --urgency=critical --icon=${def.id} "Failed to run" "${error.message}"`
        .noThrow();

      throw error;
    })
    .action(async (_, url) => {
      const config = await readConfig(def.id);

      if (!url) {
        await $`xdg-open ${def.loginUrl}`;
      } else {
        $.logStep(`Launching ${def.id} with URL: ${url}`);

        // This command is expected to be run from a desktop entry, so notify the user
        await $`notify-send --app-name ${def.id} --urgency=low --icon=${def.id} --expire-time=5000 "Launching ${def.name}"`
          .noThrow();

        const parsed = new URL(url);
        const token = parsed.searchParams.get("tk");
        if (!token) {
          throw new Error("No token found in URL");
        }

        const selectedProfileName = await (async () => {
          if (config.runProfile) {
            return config.runProfile;
          } else if (Object.keys(config.profiles).length === 1) {
            return Object.keys(config.profiles)[0];
          } else {
            const profileNames = Object.keys(config.profiles);
            if (profileNames.length === 0) {
              throw new Error("No profiles available for this game");
            } else {
              const actions = profileNames.map((name) => ($.escapeArg(`${name}=${name}`)));
              const selected = await $`notify-send --app-name ${def.id} --urgency=normal --icon=${def.id} ${$.rawArg(actions)}`.noThrow().text();
              return selected in profileNames
                ? selected
                : undefined;
            }
          }
        })();
        if (!selectedProfileName) {
          throw new Error("No profile selected");
        }

        const profile = config.profiles[selectedProfileName];
        if (!profile) {
          throw new Error(
            `Run profile '${selectedProfileName}' not found for ${def.id}`,
          );
        }

        const systemReg = await readRegistryFile(
          path.join(config.env.WINEPREFIX, "system.reg"),
        );
        const installDir = reg.findValue(
          systemReg,
          def.registryKey,
          "InstallDir",
        );
        $.logLight(`Install directory: ${installDir?.data}`);

        const command = profile.command
          .replace("%u", url)
          .replace("%t", token)
          .replace("%r", installDir?.data.toString() || "")
          .replace(
            /%\{(.*?)\}/g,
            (_, key: string) =>
              (def as unknown as Record<string, string | undefined>)[key] || "",
          );

        await $.raw`${command}`.env(config.env);
      }
    });
}

export function gameCommand(def: GameDefinition) {
  return new Command()
    .description(`Commands for ${def.name}`)
    .command("config", configCommand(def))
    .command("profile", profileCommand(def))
    .command("associate", associateCommand(def))
    .command("exec", execCommand(def))
    .command("run", runCommand(def));
}
