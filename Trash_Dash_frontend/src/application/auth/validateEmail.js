// Application layer: regola d'ingresso per il caso d'uso di autenticazione.
export const isValidEmail = (value) => {
  const email = String(value || "").trim().toLowerCase();
  const basicPattern = /^[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

  if (!basicPattern.test(email)) return false;
  if (email.includes("..")) return false;

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain || localPart.startsWith(".") || localPart.endsWith(".")) return false;

  const labels = domain.split(".");
  if (labels.length < 2) return false;

  return labels.every((label) => label.length > 0 && !label.startsWith("-") && !label.endsWith("-")) &&
    labels[labels.length - 1].length >= 2;
};
