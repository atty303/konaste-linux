import { gameCommand } from "../command.ts";
import { GameDefinition } from "../utils.ts";

const def: GameDefinition = {
  id: "sdvx",
  name: "SOUND VOLTEX EXCEED GEAR (Konaste)",
  nameJA: "SOUND VOLTEX EXCEED GEAR (コナステ)",
  urlScheme: "konaste.sdvx",
  loginUrl:
    "http://eagate.573.jp/game/konasteapp/API/login/login.html?game_id=sdvx",
  entrypoints: ["launcher", "game"],
};

export const sdvxCommand = gameCommand(def, {
  runAction: async (umu$, config, url) => {
    if (config.entrypoint === "launcher") {
      const exe =
        `C:\\Games\\SOUND VOLTEX EXCEED GEAR\\launcher\\modules\\launcher.exe`;
      await umu$`systemd-cat -t ${def.id} umu-run ${exe} ${url}`;
    } else if (config.entrypoint === "game") {
      const parsed = new URL(url);
      const token = parsed.searchParams.get("tk");
      if (!token) {
        throw new Error("No token found in URL");
      }

      const exe = `"C:\\Games\\SOUND VOLTEX EXCEED GEAR\\game\\modules\\sv6c.exe"`;
      const winCommand = `${exe} -t ${token}`;
      const command = config.runCommand.replace("%c", winCommand);
      await umu$`systemd-cat -t ${def.id} ${umu$.rawArg(command)}`;
    }
  },
});
