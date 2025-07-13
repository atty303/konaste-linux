import { gameCommand } from "../command.ts";
import { GameDefinition } from "../utils.ts";

const def: GameDefinition = {
  id: "gitadora",
  name: "GITADORA (Konaste)",
  nameJA: "GITADORA (コナステ)",
  urlScheme: "konaste.gitadora",
  loginUrl:
    "http://eagate.573.jp/game/konasteapp/API/login/login.html?game_id=gitadora",
  entrypoints: ["launcher", "guitarfreaks", "drummania"],
};

export const gitadoraCommand = gameCommand(def, {
  runAction: async (umu$, config, url) => {
    if (config.entrypoint === "launcher") {
      const exe = `C:\\Games\\GITADORA\\launcher\\modules\\launcher.exe`;
      await umu$`systemd-cat -t ${def.id} umu-run ${exe} ${url}`;
    } else if (config.entrypoint === "game") {
      const parsed = new URL(url);
      const token = parsed.searchParams.get("tk");
      if (!token) {
        throw new Error("No token found in URL");
      }

      const exe = `C:\\Games\\beatmania IIDX INFINITAS\\game\\app\\bm2dx.exe`;
      const winCommand = `${exe} -t ${token}`;
      const command = config.runCommand.replace("%c", winCommand);
      await umu$`systemd-cat -t ${def.id} ${umu$.rawArg(command)}`;
    }
  },
});
