import $ from "@david/dax";

export async function startProxy(options: {
  obsUrl: string;
  hostname: string;
  port: number;
  transform: (request: string) => Promise<string>;
}) {
  const server = Deno.serve({
    hostname: options.hostname,
    port: options.port,
    onListen: () => {
      $.log(
        `WebSocket proxy started on ws://${options.hostname}:${options.port}`,
      );
    },
    handler: (req) => {
      if (
        req.method !== "GET" ||
        !req.headers.get("upgrade")?.toLowerCase().includes("websocket")
      ) {
        return new Response("Upgrade required", { status: 426 });
      }

      const { socket: clientSock, response } = Deno.upgradeWebSocket(req, {
        idleTimeout: 0,
      });
      clientSock.onopen = () => $.log("🟢 Client connected");
      clientSock.onclose = () => $.log("🔴 Client disconnected");

      const obsSock = new WebSocket(options.obsUrl);
      obsSock.onopen = () => $.log("🔌 Connected to OBS-WebSocket");
      obsSock.onclose = () => {
        $.log("🔌 OBS-WebSocket disconnected");
        clientSock.close();
      };

      // client -> obs
      clientSock.onmessage = async (ev) => {
        let data = ev.data;
        try {
          data = await options.transform(data);
        } catch (error) {
          $.logError("Error transforming message:", error);
        }
        obsSock.send(data);
      };

      // obs -> client
      obsSock.onmessage = (ev) => {
        clientSock.send(ev.data);
      };

      clientSock.onerror = () => obsSock.close();
      obsSock.onerror = () => clientSock.close();

      return response;
    },
  });
  return await server.finished;
}
