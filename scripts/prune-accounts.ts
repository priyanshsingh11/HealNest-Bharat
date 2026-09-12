/**
 * Lists (and optionally deletes) accounts that no device can log into.
 *
 * Accounts are now bound to the device that created them (supabase/migrations/20260912000000_account_devices.sql).
 * Accounts made before that — including any test or demo account created through the old public account picker —
 * have no device registered, so nobody can sign into them. They are dead rows, and a caretaker among them is still
 * listed publicly on /discover.
 *
 *   npm run db:prune-accounts            # list them, change nothing
 *   npm run db:prune-accounts -- --delete  # delete them
 *
 * Admins are never touched. Anyone with bookings is reported and skipped, because deleting them would break the
 * booking history on both sides — deactivate those from the admin dashboard instead.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill them in.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const apply = process.argv.includes("--delete");

type UserRow = { id: string; name: string; email: string; role: string; created_at: string };

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context} failed: ${error.message}`);
}

async function main() {
  const users = await db.from("app_users").select("id,name,email,role,created_at").neq("role", "admin").order("created_at");
  fail("Reading app_users", users.error);

  const devices = await db.from("account_devices").select("user_id");
  // 42P01 is Postgres "relation does not exist"; PGRST205 is PostgREST not finding it in its schema cache.
  if (devices.error && ["42P01", "PGRST205"].includes(devices.error.code ?? "")) {
    console.error(
      "The account_devices table does not exist yet.\n" +
        "Open the Supabase SQL editor and run supabase/migrations/20260912000000_account_devices.sql, then try again.",
    );
    process.exit(1);
  }
  fail("Reading account_devices", devices.error);

  const bookings = await db.from("bookings").select("user_id,provider_id");
  fail("Reading bookings", bookings.error);

  const providers = await db.from("provider_profiles").select("id,user_id,name,category");
  fail("Reading provider_profiles", providers.error);

  const registered = new Set((devices.data ?? []).map((d) => d.user_id as string));
  const providerByUser = new Map((providers.data ?? []).map((p) => [p.user_id as string, p]));
  const bookedUsers = new Set((bookings.data ?? []).map((b) => b.user_id as string));
  const bookedProviders = new Set((bookings.data ?? []).map((b) => b.provider_id as string));

  const orphaned = ((users.data ?? []) as UserRow[]).filter((u) => !registered.has(u.id));
  if (orphaned.length === 0) {
    console.log("Every account has a registered device. Nothing to prune.");
    return;
  }

  const blocked: UserRow[] = [];
  const removable: UserRow[] = [];
  for (const user of orphaned) {
    const provider = providerByUser.get(user.id);
    const hasBookings = bookedUsers.has(user.id) || (provider ? bookedProviders.has(provider.id as string) : false);
    (hasBookings ? blocked : removable).push(user);
  }

  const describe = (u: UserRow) => {
    const provider = providerByUser.get(u.id);
    return `  ${u.id.padEnd(24)} ${u.name.padEnd(22)} ${u.email.padEnd(28)} ${provider ? `${provider.category} profile ${provider.id}` : "customer"}`;
  };

  console.log(`\nAccounts no device can log into (${orphaned.length}):\n`);
  removable.forEach((u) => console.log(describe(u)));

  if (blocked.length) {
    console.log(`\nSkipped — these have bookings, so deleting them would break the history on both sides:\n`);
    blocked.forEach((u) => console.log(describe(u)));
    console.log("\n  Deactivate these from the admin dashboard instead.");
  }

  if (!apply) {
    console.log(`\nNothing was changed. Re-run with --delete to remove the ${removable.length} account(s) listed above.\n`);
    return;
  }

  for (const user of removable) {
    const provider = providerByUser.get(user.id);
    // Services, slots, reviews and verification applications all cascade from the profile.
    if (provider) fail(`Deleting provider ${provider.id}`, (await db.from("provider_profiles").delete().eq("id", provider.id)).error);
    fail(`Deleting user ${user.id}`, (await db.from("app_users").delete().eq("id", user.id)).error);
    console.log(`  ✓ removed ${user.name} (${user.id})`);
  }
  console.log(`\nDeleted ${removable.length} account(s).\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
