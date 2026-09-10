/**
 * Seeds a Supabase project with the same demo data the in-memory store uses.
 *
 *   1. Run supabase/migrations/20260910000000_init.sql in the Supabase SQL editor.
 *   2. Put SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *   3. npm run db:seed
 *
 * Idempotent: existing rows are left untouched (insert-if-missing), so admin edits and bookings survive
 * re-runs, and re-running later adds availability for new days.
 */
import { createClient } from "@supabase/supabase-js";
import { createSeedData } from "../src/lib/mock-data";
import { SupabaseRepository } from "../src/lib/repository/supabase";
import {
  fromCategory,
  fromPricingRule,
  fromProvider,
  fromReview,
  fromService,
  fromSlot,
  fromUser,
} from "../src/lib/repository/supabase-mappers";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill them in.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const seed = createSeedData();

async function insertMissing(table: string, rows: object[]) {
  if (!rows.length) return;
  const { error } = await db.from(table).upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`Seeding ${table} failed: ${error.message}`);
  console.log(`  ✓ ${table} (${rows.length})`);
}

async function main() {
  console.log(`Seeding ${url}`);
  await insertMissing("categories", seed.categories.map(fromCategory));
  await insertMissing("app_users", seed.users.map(fromUser));
  await insertMissing("provider_profiles", seed.providers.map(fromProvider));
  await insertMissing("services", seed.services.map(fromService));
  await insertMissing("availability_slots", seed.slots.map(fromSlot));
  await insertMissing("reviews", seed.reviews.map(fromReview));
  await insertMissing("pricing_rules", seed.pricingRules.map(fromPricingRule));
  await insertMissing("platform_config", [
    {
      id: 1,
      country: seed.config.country,
      currency: seed.config.currency,
      tax_label: seed.config.taxLabel,
      tax_rate_bps: seed.config.taxRateBps,
      tax_applies_to: seed.config.taxAppliesTo,
      quote_validity_minutes: seed.config.quoteValidityMinutes,
      refund_policy: seed.config.refundPolicy,
      prescription_required_for_medicine: seed.config.prescriptionRequiredForMedicine,
      prescription_note: seed.config.prescriptionNote,
      licensing_note: seed.config.licensingNote,
      emergency_number: seed.config.emergencyNumber,
    },
  ]);

  const repo = new SupabaseRepository(db);
  let created = 0;
  for (const booking of seed.bookings) {
    if (await repo.getBooking(booking.id)) continue;
    await repo.createBooking(booking);
    created += 1;
  }
  console.log(`  ✓ sample bookings (${created} new)`);
  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
