import { Command } from "@cliffy/command";
import { Entry } from "@napi-rs/keyring";

function importCommand() {
  return new Command()
    .description("Import a secret to the keyring")
    .example(
      "Import a secret from stdin",
      "cat secret.json | konaste secret import --name <name>",
    )
    .option("-s, --service <service:string>", "Service name for the secret", {
      default: "io.github.atty303.konaste-buddy",
    })
    .option("-n, --name <name:string>", "Name of the secret", {
      required: true,
    })
    .action(async (options) => {
      if (Deno.stdin) {
        const text = await new Response(Deno.stdin.readable).text();
        if (!text) {
          throw new Error("No input provided. Please provide a secret.");
        }
        const entry = new Entry(options.service, options.name);
        entry.setPassword(text);
      }
    });
}

function exportCommand() {
  return new Command()
    .description("Export a secret from the keyring")
    .option("-s, --service <service:string>", "Service name for the secret", {
      default: "io.github.atty303.konaste-buddy",
    })
    .option("-n, --name <name:string>", "Name of the secret", {
      required: true,
    })
    .action((options) => {
      const entry = new Entry(options.service, options.name);
      const text = entry.getPassword();
      if (!text) {
        throw new Error("No secret found in keyring.");
      }
      console.log(text);
    });
}

export const secretCommand = new Command()
  .description("Manage secrets")
  .command("import", importCommand())
  .command("export", exportCommand());
