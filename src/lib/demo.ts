/** Demo-only helpers (role switching, simulated provider updates). Disable with DEMO_TOOLS=false. */
export function demoToolsEnabled(): boolean {
  return process.env.DEMO_TOOLS !== "false";
}
