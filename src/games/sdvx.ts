import {
  buildUmu,
  configureCommand,
  createDesktopEntry,
  GameDefinition,
  installCommand,
  readConfig,
  runCommand,
  writeConfig,
} from "../utils.ts";
import $ from "@david/dax";
import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";

const def: GameDefinition = {
  id: "sdvx",
  name: "SOUND VOLTEX EXCEED GEAR (Konaste)",
  nameJA: "SOUND VOLTEX EXCEED GEAR (コナステ)",
  urlScheme: "konaste.sdvx",
  loginUrl:
    "https://p.eagate.573.jp/game/konasteapp/API/login/login.html?game_id=sdvx",
  proton: "GE-Proton",
};

const install = installCommand(def)
  .action(async (options, installer) => {
    const umu$ = buildUmu(options);

    $.logStep("Setting up Wine environment");
    await umu$`umu-run winetricks win10`.noThrow(1).printCommand();
    await umu$`umu-run winetricks ie8`.noThrow(1).printCommand();

    $.logStep(`Installing ${def.id} from installer: ${installer}`);
    await umu$`umu-run msiexec /i ${installer}`;

    await createDesktopEntry(def, options.selfPath, options.applications);
    await writeConfig(def.id, options);
  });

const configure = configureCommand(def)
  .action(async (options) => {
    await createDesktopEntry(def, options.selfPath, options.applications);
    await writeConfig(def.id, options);
  });

const run = runCommand(def)
  .action(async (_options, url) => {
    const config = await readConfig(def.id);
    if (!config) {
      $.logError(
        `Configuration not found. Please run '${def.id} configure' first.`,
      );
      Deno.exit(1);
    }

    const umu$ = buildUmu(config);

    $.logStep(`Launching ${def.id} with URL: ${url}`);
    const exe =
      `C:\\Games\\SOUND VOLTEX EXCEED GEAR\\launcher\\modules\\launcher.exe`;
    await umu$`umu-run ${exe} ${url}`;
  });

const login = new Command()
  .description("Open the login page in a browser")
  .action(async () => {
    await $`xdg-open ${def.loginUrl}`;
  });

const info = new Command()
  .description("Describe the game")
  .action(() => {
    const table = new Table(
      ["ID", def.id],
      ["Name", def.name],
      ["URL Scheme", def.urlScheme],
      ["Login URL", def.loginUrl],
      ["Proton", def.proton],
    ).border();
    table.render();
  });

export const sdvxCommand = new Command()
  .description("Commands for SOUND VOLTEX EXCEED GEAR")
  .command("info", info)
  .command("install", install)
  .command("configure", configure)
  .command("run", run)
  .command("login", login);
