export const Roles = {
  HOST: "host",
  SPECTATOR: "spectator",
  PLAYER: "player",
} as const;

export type RolesTypes = (typeof Roles)[keyof typeof Roles];
