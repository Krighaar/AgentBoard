import { prisma } from "./db";

let initialized = false;

export async function ensureDefaults() {
  if (initialized) return;
  initialized = true;

  // Ensure default board exists
  await prisma.board.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Default Board",
      description: "Default task board",
    },
  });
}
