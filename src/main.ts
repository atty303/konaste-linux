import { Command } from "@cliffy/command";
import { gitadoraCommand } from "./games/gitadora.ts";

await new Command()
  .name("konaste")
  .command("gitadora", gitadoraCommand)
  .parse();
