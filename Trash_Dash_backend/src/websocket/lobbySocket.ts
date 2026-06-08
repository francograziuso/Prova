import http from "http";
import { WebSocketServer, WebSocket } from "ws";

type Client = WebSocket & { lobbyCode?: string; playerName?: string };

const rooms = new Map<string, Set<Client>>();

function send(client: WebSocket, type: string, payload: unknown = {}) {
  client.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
}

function broadcast(lobbyCode: string, type: string, payload: unknown = {}, except?: Client) {
  const room = rooms.get(lobbyCode);
  if (!room) return;
  for (const client of room) {
    if (client.readyState === WebSocket.OPEN && client !== except) send(client, type, payload);
  }
}

export function createLobbyWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket: Client) => {
    send(socket, "connected", { message: "WebSocket TrashDash attivo" });

    socket.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const type = msg.type;
        const payload = msg.payload ?? {};

        if (type === "join_lobby") {
          const lobbyCode = String(payload.code || "").toUpperCase();
          if (!lobbyCode) return send(socket, "error", { message: "Codice lobby mancante" });
          socket.lobbyCode = lobbyCode;
          socket.playerName = String(payload.username || "Giocatore");
          if (!rooms.has(lobbyCode)) rooms.set(lobbyCode, new Set());
          rooms.get(lobbyCode)!.add(socket);
          send(socket, "lobby_joined", { code: lobbyCode });
          broadcast(lobbyCode, "opponent_joined", { username: socket.playerName }, socket);
          return;
        }

        if (!socket.lobbyCode) return send(socket, "error", { message: "Prima entra in una lobby" });

        if (["progress", "finished", "abandoned", "heartbeat"].includes(type)) {
          broadcast(socket.lobbyCode, type, { ...payload, username: socket.playerName }, socket);
          return;
        }

        send(socket, "error", { message: `Tipo messaggio non supportato: ${type}` });
      } catch {
        send(socket, "error", { message: "Messaggio JSON non valido" });
      }
    });

    socket.on("close", () => {
      if (socket.lobbyCode) {
        const room = rooms.get(socket.lobbyCode);
        room?.delete(socket);
        broadcast(socket.lobbyCode, "opponent_left", { username: socket.playerName }, socket);
        if (room && room.size === 0) rooms.delete(socket.lobbyCode);
      }
    });
  });

  return wss;
}
