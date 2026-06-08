import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { createLobbyWebSocketServer } from "./websocket/lobbySocket";

const server = http.createServer(app);
createLobbyWebSocketServer(server);

server.listen(env.PORT, "0.0.0.0", () => {
  console.log(`[TrashDash] Backend attivo su http://localhost:${env.PORT}/api`);
  console.log(`[TrashDash] Health: http://localhost:${env.PORT}/api/health`);
});
