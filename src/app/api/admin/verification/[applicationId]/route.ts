import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { reviewVerification } from "@/lib/services/verification";
import { verificationReviewSchema } from "@/lib/validations";

type Context = { params: Promise<{ applicationId: string }> };

/** PATCH — admin: `{ decision: "approve" | "reject", note }`. Approval verifies the provider and applies the details. */
export async function PATCH(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const { applicationId } = await params;
    const { decision, note } = verificationReviewSchema.parse(await readJson(request));
    const application = await reviewVerification(getRepository(), await getSession(), applicationId, decision, note);
    return { application };
  });
}
