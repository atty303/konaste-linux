import * as path from "jsr:@std/path";
import xdg from "@404wolf/xdg-portable";
import $ from "@david/dax";
import { GameProfile } from "./games.ts";

export type GameConfig = {
  env: Record<string, string>;
  profiles: Record<string, GameProfile>;
  runProfile: string | undefined;
};

export const configDir = path.join(xdg.config(), "konaste");

function configPath(game: string) {
  return path.join(configDir, `${game}.json`);
}

export async function tryReadConfig(game: string): Promise<GameConfig | undefined> {
  try {
    return await readConfig(game);
  } catch (_err) {
    return undefined;
  }
}

export async function readConfig(game: string): Promise<GameConfig> {
  const path = $.path(configPath(game));
  if (!await path.exists()) {
    throw new Error(
      `Configuration not found. Please run '${game} configure' first.`,
    );
  }
  return await path.readJson();
}

export async function writeConfig(
  gameId: string,
  config: GameConfig,
): Promise<void> {
  const path = $.path(configPath(gameId));
  await path.parent()?.ensureDir();
  await path.writeJsonPretty(config);
}
