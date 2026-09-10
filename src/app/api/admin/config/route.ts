import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { updatePlatformConfig } from "@/lib/services/admin";
import { platformConfigUpdateSchema } from "@/lib/validations";

/** PATCH — admin updates country-specific settings (tax, refunds, prescription and licensing notes). */
export async function PATCH(request: Request) {
  return handle(request, LIMITS.write, async () => {
    const patch = platformConfigUpdateSchema.parse(await readJson(request));
    const config = await updatePlatformConfig(getRepository(), await getSession(), patch);
    return { config };
  });
}
