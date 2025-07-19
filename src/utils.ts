import * as path from "jsr:@std/path";
import xdg from "@404wolf/xdg-portable";
import $ from "@david/dax";

export type Game = string;

export type GameConfig = {
  env: Record<string, string>;
  runProfile: string | undefined;
};

export const configDir = path.join(xdg.config(), "konaste");

function configPath(game: Game) {
  return path.join(configDir, `${game}.json`);
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

export async function writeConfig(
  gameId: Game,
  config: GameConfig,
): Promise<void> {
  const path = $.path(configPath(gameId));
  await path.parent()?.ensureDir();
  await path.writeJsonPretty(config);
}
