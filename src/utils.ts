import xdg from "@404wolf/xdg-portable";
import $, { build$, createExecutableCommand } from "@david/dax";
import { Command } from "@cliffy/command";

export type Game = "gitadora" | "infinitas" | "sdvx";

export type GameDefinition = {
  id: Game;
  name: string;
  nameJA: string;
  urlScheme: string;
  proton: string | undefined;
};

export type GameConfig = {
  umuRun: string;
  winePrefix: string;
  protonPath: string;
  gameId: string;
};

function configPath(game: Game) {
  return `${xdg.config()}/konaste/${game}.json`;
}

export async function readConfig(game: Game): Promise<GameConfig | undefined> {
  const path = $.path(configPath(game));
  try {
    return await path.readJson();
  } catch (err) {
    $.logWarn(`Failed to read config for ${game}: ${err}`);
  }
}

export async function writeConfig(
  game: Game,
  config: GameConfig,
): Promise<void> {
  const path = $.path(configPath(game));
  await path.parent()?.ensureDir();
  await path.writeJsonPretty(
    {
      umuRun: config.umuRun,
      winePrefix: config.winePrefix,
      protonPath: config.protonPath,
      gameId: config.gameId,
    } satisfies GameConfig,
  );
}

export const applicationsPath = `${xdg.data()}/applications`;

export async function createDesktopEntry(
  def: GameDefinition,
  selfPath: string,
  applications: string = applicationsPath,
) {
  $.logStep("Creating desktop entry for url scheme handler");

  const filename = `${def.id}.desktop`;
  const mimeType = `x-scheme-handler/${def.urlScheme}`;
  const path = `${applications}/${filename}`;
  $.logLight(`Creating desktop entry at ${path}`);

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
  await $`update-desktop-database ${applications}`.printCommand();
  await $`xdg-mime default ${filename} ${mimeType}`.printCommand();

  $.logStep("Successfully created desktop entry");
}

export function buildUmu(config: GameConfig & { umuRun: string }) {
  return build$({
    commandBuilder: (builder) =>
      builder
        .registerCommand("umu-run", createExecutableCommand(config.umuRun))
        .env({
          WINEPREFIX: config.winePrefix,
          PROTONPATH: config.protonPath,
          GAMEID: config.gameId,
        }),
  });
}

const selfPath = Deno.execPath().includes("deno") ? undefined : Deno.execPath();

function umuOptions(def: GameDefinition) {
  return new Command()
    .option("--self-path <path:file>", "Path to the this executable", {
      default: selfPath,
      required: true,
    })
    .option("--umu-run <path:file>", "Path to umu-run executable", {
      default: "umu-run",
    })
    .option("-w, --wine-prefix <path:file>", "Wine prefix", {
      default: `${xdg.state()}/konaste/${def.id}`,
    })
    .option("-p, --proton-path <path:file>", "Proton path", {
      default: def.proton,
    })
    .option("--game-id <id:string>", "Game ID", { default: `umu-${def.id}` })
    .option("--applications <path:file>", "Path to desktop applications", {
      default: applicationsPath,
    });
}

export function installCommand(def: GameDefinition) {
  return umuOptions(def)
    .description("Install the game")
    .arguments("<installer:file>");
}

export function configureCommand(def: GameDefinition) {
  return umuOptions(def)
    .description("Alter the configuration for run command");
}

export function runCommand(_def: GameDefinition) {
  return new Command()
    .description(
      "Run the game from browser\nThis command is used by URL scheme handlers. You should not run it directly.",
    )
    .arguments("<url:string>");
}
