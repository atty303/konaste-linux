import { gameCommand } from "../command.ts";
import {
  GameDefinition,
} from "../utils.ts";

const def: GameDefinition = {
  id: "infinitas",
  name: "beatmania IIDX INFINITAS (Konaste)",
  nameJA: "beatmania IIDX INFINITAS (コナステ)",
  urlScheme: "bm2dxinf",
  loginUrl: "https://p.eagate.573.jp/game/infinitas/2/api/login/login.html",
  entrypoints: ["launcher", "game"],
  //icon: "C:\\Games\\beatmania IIDX INFINITAS\\beatmania IIDX INFINITAS.ico",
};
// /drive_c/users/steamuser/Desktop/beatmania IIDX INFINITAS.url

export const infinitasCommand = gameCommand(def, {
  runAction: async (umu$, config, url) => {
    if (config.entrypoint === "launcher") {
      const exe =
        `C:\\Games\\beatmania IIDX INFINITAS\\launcher\\modules\\bm2dx_launcher.exe`;
      await umu$`systemd-cat -t ${def.id} umu-run ${exe} ${url}`;
    } else if (config.entrypoint === "game") {
      const parsed = new URL(url);
      const token = parsed.searchParams.get("tk");
      if (!token) {
        throw new Error("No token found in URL");
      }

      const exe = `"C:\\Games\\beatmania IIDX INFINITAS\\game\\app\\bm2dx.exe"`;
      const winCommand = `${exe} -t ${token}`;
      const command = config.runCommand.replace("%c", winCommand);
      await umu$`systemd-cat -t ${def.id} ${umu$.rawArg(command)}`;
    }
  },
});
