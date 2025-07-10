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

const def: GameDefinition = {
  id: "gitadora",
  name: "GITADORA (Konaste)",
  nameJA: "GITADORA (コナステ)",
  urlScheme: "konaste.gitadora",
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
    const exe = `C:\\Games\\GITADORA\\launcher\\modules\\launcher.exe`;
    await umu$`umu-run ${exe} ${url}`;
  });

export const gitadoraCommand = new Command()
  .description("Commands for GITADORA")
  .command("install", install)
  .command("configure", configure)
  .command("run", run);
