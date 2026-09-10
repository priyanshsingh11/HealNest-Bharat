import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { updatePricingRule } from "@/lib/services/admin";
import { pricingRuleUpdateSchema } from "@/lib/validations";

type Context = { params: Promise<{ ruleId: string }> };

/** PATCH — admin updates a margin rule. Applies to new quotes only; booked price snapshots never change. */
export async function PATCH(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const { ruleId } = await params;
    const patch = pricingRuleUpdateSchema.parse(await readJson(request));
    const rule = await updatePricingRule(getRepository(), await getSession(), ruleId, patch);
    return { rule };
  });
}
