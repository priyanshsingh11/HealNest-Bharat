import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { updateService } from "@/lib/services/admin";
import { serviceUpdateSchema } from "@/lib/validations";

type Context = { params: Promise<{ serviceId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const { serviceId } = await params;
    const patch = serviceUpdateSchema.parse(await readJson(request));
    const service = await updateService(getRepository(), await getSession(), serviceId, patch);
    return { service };
  });
}
