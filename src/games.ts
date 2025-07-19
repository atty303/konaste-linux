export type GameProfile = {
  command: string;
};

export type GameDefinition = {
  id: string;
  name: string;
  nameLocalized?: Record<string, string>;
  urlScheme: string;
  loginUrl: string;
  registryKey: string;
  profiles: Record<string, GameProfile>;
};

export const defaultGames: GameDefinition[] = [
  {
    id: "infinitas",
    name: "beatmania IIDX INFINITAS",
    nameLocalized: { ja: "beatmania IIDX INFINITAS" },
    urlScheme: "bm2dxinf",
    loginUrl: "https://p.eagate.573.jp/game/infinitas/2/api/login/login.html",
    registryKey: "Software\\KONAMI\\beatmania IIDX INFINITAS",
    profiles: {
      launcher: {
        command:
          "systemd-cat -t %{id} umu-run %r\\launcher\\modules\\bm2dx_launcher.exe %u",
      },
      game: {
        command: "systemd-cat -t %{id} umu-run %r\\game\\app\\bm2dx.exe -t %t",
      },
    },
  },
  // /drive_c/users/steamuser/Desktop/beatmania IIDX INFINITAS.url
  {
    id: "sdvx",
    name: "SOUND VOLTEX EXCEED GEAR",
    nameLocalized: { ja: "SOUND VOLTEX EXCEED GEAR" },
    urlScheme: "konaste.sdvx",
    loginUrl:
      "http://eagate.573.jp/game/konasteapp/API/login/login.html?game_id=sdvx",
    registryKey: "Software\\KONAMI\\SOUND VOLTEX EXCEED GEAR",
    profiles: {
      launcher: {
        command:
          "systemd-cat -t %{id} umu-run %r\\launcher\\modules\\launcher.exe %u",
      },
      game: {
        command:
          "systemd-cat -t %{id} umu-run %r\\game\\modules\\sv6c.exe -t %t",
      },
    },
  },
  {
    id: "gitadora",
    name: "GITADORA",
    nameLocalized: { ja: "GITADORA" },
    urlScheme: "konaste.gitadora",
    loginUrl:
      "http://eagate.573.jp/game/konasteapp/API/login/login.html?game_id=gitadora",
    registryKey: "Software\\KONAMI\\GITADORA",
    profiles: {
      launcher: {
        command:
          "systemd-cat -t %{id} umu-run %r\\launcher\\modules\\launcher.exe %u",
      },
    },
  },
];
