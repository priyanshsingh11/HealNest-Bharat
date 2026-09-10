import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { setSlotStatus } from "@/lib/services/admin";
import { slotUpdateSchema } from "@/lib/validations";

type Context = { params: Promise<{ slotId: string }> };

/** PATCH — provider opens or blocks one of their own (unbooked) slots. */
export async function PATCH(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const { slotId } = await params;
    const { status } = slotUpdateSchema.parse(await readJson(request));
    const slot = await setSlotStatus(getRepository(), await getSession(), slotId, status);
    return { slot };
  });
}
