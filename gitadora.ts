import { Command } from "@cliffy/command";
//import { consola } from "npm:consola";
import $, { build$ } from "@david/dax";
import xdg from "@404wolf/xdg-portable";

type Config = {
  winePrefix: string;
  protonPath: string;
  gameId: string;
};

type GlobalOptions = Config & {
};

await new Command()
  .name("gitadora")
  .version("0.1.0")
  .globalOption("-w, --wine-prefix <path:file>", "Wine prefix", { default: "gitadora" })
  .globalOption("-p, --proton-path <path:file>", "Proton path", { default: "GE-Proton" })
  .globalOption("--game-id <id:string>", "Game ID", { default: "umu-gitadora" })
  .command("install", "Install app")
  .option("applications <path:file>", "Path to applications", { default: "application" })
  .arguments("<installer:file>")
  .action((options, installer) => install({
    ...options,
    installer
  }))
  .command("configure", "Configure app")
  .action((options) => configure({
    ...options
  }))
  .command("run", "Run app")
  .arguments("<url:string>")
  .action((options, url) => run({
    ...options,
    url
  }))
  .parse(Deno.args);

async function install(opts: GlobalOptions & { installer: string }) {
  if (!await $.commandExists("umu-run")) {
    throw new Error("umu-run is not installed");
  }

  const desktopEntry = `[Desktop Entry]
Name=Gitadora (Konaste)
Exec=gitadora run %u
Type=Application
Categories=Game;
Terminal=false
StartupNotify=true
MimeType=x-scheme-handler/konaste.gitadora;
`;

  const shortcut = xdg.data() + "/applications/gitadora.desktop";
  $.path(shortcut).writeTextSync(desktopEntry);

  await $`update-desktop-database ${xdg.data()}/applications`;
  await $`xdg-mime default gitadora.desktop x-scheme-handler/konaste.gitadora`;

  await configure(opts);

  const umu = build$({
    commandBuilder: builder => builder.env({
      WINEPREFIX: opts.winePrefix,
      PROTONPATH: opts.protonPath,
      GAMEID: opts.gameId,
    }),
  });

  await umu`umu-run winetricks win10 ie8`.noThrow(1);

  await umu`umu-run msiexec /i ${opts.installer}`;
}

function configure(opts: GlobalOptions) {
  const configPath = xdg.config() + "/konaste/gitadora.json";
  $.path(configPath).parent()?.ensureDirSync();
  $.path(configPath).writeJsonPrettySync({
    winePrefix: opts.winePrefix,
    protonPath: opts.protonPath,
    gameId: opts.gameId,
  } satisfies Config);
}

async function run(opts: GlobalOptions & { url: string }) {
  const configPath = xdg.config() + "/konaste/gitadora.json";
  if (!$.path(configPath).existsSync()) {
    throw new Error("Gitadora is not configured. Please run 'gitadora configure' first.");
  }

  const savedConfig = $.path(configPath).readJsonSync<Config>();
  const config: Config = {
    ...savedConfig,
  };

  const umu = build$({
    commandBuilder: builder => builder.env({
      WINEPREFIX: config.winePrefix,
      PROTONPATH: config.protonPath,
      GAMEID: config.gameId,
    }),
  });

//  const exe = `${config.winePrefix}/drive_c/Games/GITADORA/launcher/modules/launcher.exe`;
  const exe = `c:\\Games\\GITADORA\\launcher\\modules\\launcher.exe`;
  await umu`umu-run ${exe} ${opts.url}`;
}