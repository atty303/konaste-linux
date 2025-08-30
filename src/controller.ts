import { Command } from "@cliffy/command";

type EventType = "button" | "axis";

const JS_EVENT_BUTTON = 0x01;
const JS_EVENT_AXIS = 0x02;
const JS_EVENT_INIT = 0x80;

function parseJoystickEvent(data: DataView) {
  const time = data.getUint32(0, true);
  const value = data.getUint16(4, true);
  const type = data.getUint8(6);
  const number = data.getUint8(7);

  const isInit = (type & JS_EVENT_INIT) !== 0;
  const isButton = (type & JS_EVENT_BUTTON) !== 0;
  const isAxis = (type & JS_EVENT_AXIS) !== 0;

  return {
    time,
    value,
    isInit,
    type: isButton ? "button" as const : isAxis ? "axis" as const : undefined,
    number,
  };
}

function readJoystickState(device: string) {
  return new Promise<Map<[EventType, number], number>>((resolve, reject) => {
    (async () => {
      const file = await Deno.open(device, { read: true });
      const state = new Map<[EventType, number], number>();
      while (true) {
        const buffer = new Uint8Array(8);
        const timer = setTimeout(() => {
          file.close();
          resolve(state);
        }, 100);
        const readed = await file.read(buffer);
        if (!readed || readed < 8) {
          file.close();
          resolve(state);
          return;
        }

        clearTimeout(timer);

        const event = parseJoystickEvent(new DataView(buffer.buffer));
        if (event.type) {
          state.set([event.type, event.number], event.value);
        }
      }
    })().catch((error) => {
      reject(error);
    });
  });
}

const readCommand = new Command()
  .description("Read controller state")
  .option("-d, --device <device:string>", "Device path", {
    required: true,
  })
  .action(async (options) => {
    // Discard the first events to ensure we get the latest state
    await readJoystickState(options.device);

    const state = await readJoystickState(options.device);
    const states = Array.from(state.entries()).map(([key, value]) => ({
      type: key[0],
      number: key[1],
      value,
    }));
    console.log(JSON.stringify(states, null, 2));
    Deno.exit(0);
  });

export const controllerCommand = new Command()
  .description("Controller management commands")
  .command("read", readCommand);
