import { Command } from "@cliffy/command";
import { gitadoraCommand } from "./games/gitadora.ts";
import { infinitasCommand } from "./games/infinitas.ts";

await new Command()
  .name("konaste")
  .command("gitadora", gitadoraCommand)
  .command("infinitas", infinitasCommand)
  .parse();
