import xdg from "@404wolf/xdg-portable";
import { Command, EnumType } from "@cliffy/command";
import {
  buildUmu$,
  configPath,
  GameConfig,
  GameDefinition,
  readConfig,
  tryReadConfig,
} from "./utils.ts";
import $ from "@david/dax";
import { Table } from "@cliffy/table";

function configureCommand(def: GameDefinition) {
  const entrypointType = new EnumType(def.entrypoints);
  return new Command()
    .description("Alter the configuration for game")
    .type("entrypoint", entrypointType)
    .option("--umu-run <path:file>", "Path to umu-run executable")
    .option("-w, --wine-prefix <path:file>", "Wine prefix")
    .option("--game-id <id:string>", "Game ID")
    .option("-e, --entrypoint <type:entrypoint>", "Entrypoint to use on run")
    .option("--run-command <command:string>", "Command to run the game")
    .option("--env.* <value:string>", "Environment variable")
    .action(async (options) => {
      const defaultConfig = {
        umuRun: "umu-run",
        entrypoint: "launcher",
        runCommand: "umu-run %c",
        env: {
          WINEPREFIX: `${xdg.state()}/konaste/${def.id}`,
          GAMEID: `umu-${def.id}`,
        },
      };
      const config0 = await tryReadConfig(def.id) ?? defaultConfig;
      const config = {
        umuRun: options.umuRun ?? config0.umuRun,
        entrypoint: options.entrypoint ?? config0.entrypoint,
        runCommand: options.runCommand ?? config0.runCommand,
        env: {
          ...config0.env,
          WINEPREFIX: options.winePrefix ?? config0.env.WINEPREFIX,
          GAMEID: options.gameId ?? config0.env.GAMEID,
          ...options.env,
        },
      };
      const path = $.path(configPath(def.id));
      await path.parent()?.ensureDir();
      await path.writeJsonPretty(config);

      $.logStep(`Configuration for ${def.name} saved to ${path}`);
      $.log(JSON.stringify(config, null, 2));
    });
}

function createCommand(def: GameDefinition) {
  return new Command()
    .description("Create a new wine prefix")
    .action(async (_options) => {
      const config = await readConfig(def.id);
      const umu$ = buildUmu$(config);
      await umu$`umu-run wineboot --init`;
    });
}

function associateCommand(def: GameDefinition) {
  const applicationsPath = `${xdg.data()}/applications`;

  return new Command()
    .description("Associate the URL scheme with the game")
    .option("--self-path <path:file>", "Path to the this executable")
    .option("--applications <path:file>", "Path to desktop applications", {
      default: applicationsPath,
    })
    .action(async (options) => {
      const selfPath = Deno.execPath().includes("deno")
        ? options.selfPath
        : Deno.execPath();
      if (!selfPath) {
        throw new Error("--self-path is required");
      }

      const filename = `${def.id}.desktop`;
      const mimeType = `x-scheme-handler/${def.urlScheme}`;
      const path = `${options.applications}/${filename}`;
      $.log(`Creating desktop entry at ${path}`);

      const body = `[Desktop Entry]
Name=${def.name}
Name[ja]=${def.nameJA}
Exec=${selfPath} ${def.id} run %u
Type=Application
Categories=Game;
Terminal=false
StartupNotify=true
MimeType=${mimeType};
`;
      await $.path(path).writeText(body);

      $.log("Updating desktop database");
      await $`update-desktop-database ${options.applications}`.printCommand();
      await $`xdg-mime default ${filename} ${mimeType}`.printCommand();

      $.logStep("Successfully created desktop entry");
    });
}

function execCommand(def: GameDefinition) {
  return new Command()
    .description("Run a command in the game wine prefix")
    .arguments("<...command:string>")
    .action(async (_, ...command) => {
      const config = await readConfig(def.id);
      const umu$ = buildUmu$(config);
      await umu$.raw`${command.join(" ")}`;
    });
}

function runCommand(
  def: GameDefinition,
  runAction: (
    umu$: ReturnType<typeof buildUmu$>,
    config: GameConfig,
    url: string,
  ) => Promise<void>,
) {
  return new Command()
    .description(
      "Run the game from browser\nThis command is used by URL scheme handlers. You should not run it directly.",
    )
    .arguments("<url:string>")
    .action(async (_, url) => {
      const config = await readConfig(def.id);
      const umu$ = buildUmu$(config);
      $.logStep(`Launching ${def.id} with URL: ${url}`);
      await runAction(umu$, config, url);
    });
}

function loginCommand(def: GameDefinition) {
  return new Command()
    .description("Open the login page in a browser")
    .action(async () => {
      await $`xdg-open ${def.loginUrl}`;
    });
}

function infoCommand(def: GameDefinition) {
  return new Command()
    .description("Describe the game")
    .action(() => {
      const table = new Table(
        ["ID", def.id],
        ["Name", def.name],
        ["URL Scheme", def.urlScheme],
        ["Login URL", def.loginUrl],
      ).border();
      table.render();
    });
}

export function gameCommand(def: GameDefinition, opts: {
  runAction: (
    umu$: ReturnType<typeof buildUmu$>,
    config: GameConfig,
    url: string,
  ) => Promise<void>;
}) {
  return new Command()
    .description(`Commands for ${def.name}`)
    .command("configure", configureCommand(def))
    .command("create", createCommand(def))
    .command("associate", associateCommand(def))
    .command("exec", execCommand(def))
    .command("run", runCommand(def, opts.runAction))
    .command("login", loginCommand(def))
    .command("info", infoCommand(def));
}
