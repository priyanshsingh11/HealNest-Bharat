import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { addSlot } from "@/lib/services/admin";
import { slotCreateSchema } from "@/lib/validations";

type Context = { params: Promise<{ providerId: string }> };

/** POST — provider adds a new availability window to their own calendar. */
export async function POST(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const { providerId } = await params;
    const input = slotCreateSchema.parse(await readJson(request));
    const slot = await addSlot(getRepository(), await getSession(), providerId, input.startAt, input.durationMinutes);
    return { slot };
  });
}
