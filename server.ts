import "dotenv/config";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { attachSocketServer } from "./lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
// Do not use process.env.HOSTNAME — on Windows it is the PC name (e.g. Laptop_HP_dom).
const hostname = process.env.HOST ?? (dev ? "localhost" : "127.0.0.1");
const port = Number(process.env.PORT ?? 3001);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    handle(req, res, parsedUrl);
  });

  attachSocketServer(httpServer);

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
