import xdg from "@404wolf/xdg-portable";
import $, { build$, createExecutableCommand } from "@david/dax";

export type Game = "gitadora" | "infinitas" | "sdvx";

export type GameDefinition = {
  id: Game;
  name: string;
  nameJA: string;
  urlScheme: string;
  loginUrl: string;
  entrypoints: string[];
};

export type GameConfig = {
  umuRun: string;
  winePrefix: string;
  protonPath: string;
  gameId: string;
  entrypoint: "launcher" | string;
  runCommand: string;
  env: Record<string, string>;
};

export function buildUmu$(config: GameConfig) {
  return build$({
    commandBuilder: (builder) =>
      builder
        .registerCommand("umu-run", createExecutableCommand(config.umuRun))
        .env(config.env),
  });
}

export function configPath(game: Game) {
  return `${xdg.config()}/konaste/${game}.json`;
}

export async function tryReadConfig(
  game: Game,
): Promise<GameConfig | undefined> {
  try {
    return await readConfig(game);
  } catch (_err) {
    return undefined;
  }
}

export async function readConfig(game: Game): Promise<GameConfig> {
  const path = $.path(configPath(game));
  if (!await path.exists()) {
    throw new Error(
      `Configuration not found. Please run '${game} configure' first.`,
    );
  }
  return await path.readJson();
}
