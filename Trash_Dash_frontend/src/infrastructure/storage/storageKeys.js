// Infrastructure layer: chiavi persistenti e consenso posizione.

export const STORAGE_KEYS = {
  token: "trashdash.authToken",
  user: "trashdash.currentUser",
  guestProfile: "trashdash.guestProfile",
  guestLocationConsent: "trashdash.locationConsent.guest",
  userLocationConsentPrefix: "trashdash.locationConsent.user.",
};

export const LOCATION_CONSENT = {
  unset: "unset",
  always: "always",
  once: "once",
  never: "never",
};
