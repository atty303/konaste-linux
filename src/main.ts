import { Command } from "@cliffy/command";
import { gitadoraCommand } from "./games/gitadora.ts";
import { infinitasCommand } from "./games/infinitas.ts";
import { sdvxCommand } from "./games/sdvx.ts";

await new Command()
  .name("konaste")
  .command("gitadora", gitadoraCommand)
  .command("infinitas", infinitasCommand)
  .command("sdvx", sdvxCommand)
  .parse();
