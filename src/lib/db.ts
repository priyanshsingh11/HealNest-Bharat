import "server-only";
import { createClient } from "@supabase/supabase-js";
import { MemoryRepository } from "@/lib/repository/memory";
import { SupabaseRepository } from "@/lib/repository/supabase";
import type { CareRepository } from "@/lib/repository/types";
import { createSeedData } from "@/lib/seed";

// Chooses the data source once per server process.
//   DATA_SOURCE=memory   → in-memory store (settings and demo accounts only; resets on restart)
//   DATA_SOURCE=supabase → Supabase (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
//   DATA_SOURCE=auto     → Supabase when configured, otherwise in-memory (default)

type GlobalWithRepo = typeof globalThis & { __healnestRepository?: CareRepository };
const globalStore = globalThis as GlobalWithRepo;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function createRepository(): CareRepository {
  const source = (process.env.DATA_SOURCE ?? "auto").toLowerCase();

  if (source === "supabase" || (source === "auto" && isSupabaseConfigured())) {
    if (!isSupabaseConfigured()) {
      throw new Error("DATA_SOURCE=supabase but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
    }
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return new SupabaseRepository(client);
  }

  return new MemoryRepository(createSeedData());
}

/** Shared repository instance. Cached on globalThis so dev hot-reloads keep in-memory state. */
export function getRepository(): CareRepository {
  const cached = globalStore.__healnestRepository;
  // After a hot reload a cached Supabase repository is an instance of the previous class and can miss new methods.
  // It holds no state, so rebuild it. (The in-memory one is kept on purpose; restart the server to pick up its changes.)
  if (!cached || (cached.kind === "supabase" && !(cached instanceof SupabaseRepository))) {
    globalStore.__healnestRepository = createRepository();
  }
  return globalStore.__healnestRepository!;
}
