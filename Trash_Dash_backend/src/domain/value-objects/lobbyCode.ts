const LOBBY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeLobbyCode(value: string) {
  const raw = String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!raw) return "";
  if (raw.startsWith("TD-")) return raw;
  if (raw.startsWith("TD")) return `TD-${raw.slice(2)}`;
  return `TD-${raw}`;
}

export function createLobbyCode(random = Math.random) {
  let code = "TD-";
  for (let index = 0; index < 4; index += 1) {
    code += LOBBY_CODE_ALPHABET[Math.floor(random() * LOBBY_CODE_ALPHABET.length)];
  }
  return code;
}
