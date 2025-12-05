/**
 * ⚠️ DEPRECATED: This entire file is deprecated and should not be used!
 * 
 * This credit sync scheduler was the root cause of the "credit reset on server restart" bug.
 * 
 * THE PROBLEM:
 * - Ran immediately on server startup
 * - Ran every 6 hours automatically
 * - Called syncAllInstanceCredits() which DESTROYED accumulated credits
 * - Reset ALL users' credits to base plan amounts
 * - Caused massive credit loss for users who had accumulated credits
 * 
 * EXAMPLE OF THE BUG:
 * - User had 1,200 credits (200 free + 1,000 starter)
 * - Server restarted
 * - Scheduler ran immediately
 * - syncAllInstanceCredits() reset to 1,000
 * - User lost 200 credits!
 * 
 * WHY IT'S NOT NEEDED:
 * - The webhook system (backend/src/routes/billing.ts) already handles credit updates correctly
 * - The /api/billing/sync-credits endpoint provides safe manual sync
 * - Both use updateInstancePlan() which PRESERVES accumulated credits
 * 
 * This file is kept for historical reference only. All functions throw errors to prevent use.
 * 
 * @deprecated DO NOT USE - Causes credit loss for all users
 */

/**
 * @deprecated This function destroys accumulated credits - DO NOT USE
 * @throws {Error} Always throws an error to prevent accidental use
 */
export async function runCreditSyncTask(): Promise<void> {
  throw new Error(
    'runCreditSyncTask() is deprecated! ' +
    'This function was the root cause of the credit reset bug. ' +
    'It destroys accumulated credits for ALL users.'
  );
}

/**
 * @deprecated This scheduler destroys accumulated credits - DO NOT USE
 * @throws {Error} Always throws an error to prevent accidental use
 */
export function startCreditSyncScheduler(): void {
  throw new Error(
    'startCreditSyncScheduler() is deprecated! ' +
    'This scheduler was the root cause of the credit reset bug. ' +
    'It ran on server startup and every 6 hours, destroying accumulated credits for ALL users. ' +
    'The webhook system already handles credit updates correctly.'
  );
}
