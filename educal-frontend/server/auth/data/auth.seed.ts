import { hashPassword, normalizeEmail } from "@/server/auth/crypto";
import type { AuthDb, AuthUserRecord, UserRole } from "@/server/auth/types";
import type { IEventUser } from "@/features/calendar/interfaces";

interface SeedUserInput {
  id: string;
  name: string;
  picturePath: string | null;
  role: UserRole;
  email: string;
  password: string;
}

const AUTH_USERS_CREDENTIALS_SEED: SeedUserInput[] = [
  {
    id: "f3b035ac-49f7-4e92-a715-35680bf63175",
    name: "Daniel Santos",
    picturePath: null,
    role: "admin",
    email: "daniel@educal.local",
    password: "Password123!",
  },
  {
    id: "3e36ea6e-78f3-40dd-ab8c-a6c737c3c422",
    name: "Filipe Freitas",
    picturePath: null,
    role: "editor",
    email: "filipe@educal.local",
    password: "Password123!",
  },
  {
    id: "a7aff6bd-a50a-4d6a-ab57-76f76bb27cf5",
    name: "Sandra Ferreira",
    picturePath: null,
    role: "viewer",
    email: "sandra@educal.local",
    password: "Password123!",
  },
];

export const AUTH_PUBLIC_USERS_SEED: IEventUser[] = AUTH_USERS_CREDENTIALS_SEED.map(
  ({ id, name, picturePath }) => ({
    id,
    name,
    picturePath,
  }),
);

const toStoredUser = (user: SeedUserInput): AuthUserRecord => ({
  id: user.id,
  name: user.name,
  picturePath: user.picturePath,
  role: user.role,
  email: normalizeEmail(user.email),
  passwordHash: hashPassword(user.password),
});

export const buildAuthSeed = (): AuthDb => ({
  users: AUTH_USERS_CREDENTIALS_SEED.map(toStoredUser),
  sessions: [],
});


