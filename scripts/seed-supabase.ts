/**
 * Seeds a Supabase project with what a fresh store needs: categories, pricing rules, platform settings and the demo
 * customer and admin accounts. No providers or bookings — caretakers sign up themselves.
 *
 *   1. Run every file in supabase/migrations (in filename order) in the Supabase SQL editor.
 *   2. Put SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *   3. npm run db:seed
 *
 * Idempotent: existing rows are left untouched (insert-if-missing), so admin edits survive re-runs.
 */
import { createClient } from "@supabase/supabase-js";
import { fromCategory, fromPricingRule, fromUser } from "../src/lib/repository/supabase-mappers";
import { createSeedData } from "../src/lib/seed";

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
  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
