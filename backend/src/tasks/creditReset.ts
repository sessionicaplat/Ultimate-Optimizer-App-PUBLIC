import { resetMonthlyCredits } from '../db/appInstances';

/**
 * Credit reset task that runs daily to reset credits for instances
 * where the reset date has passed
 */
export async function runCreditResetTask(): Promise<void> {
  try {
    console.log('[CreditReset] Running credit reset task...');
    const resetCount = await resetMonthlyCredits();
    
    if (resetCount > 0) {
      console.log(`[CreditReset] Successfully reset credits for ${resetCount} instance(s)`);
    } else {
      console.log('[CreditReset] No instances needed credit reset');
    }
  } catch (error) {
    console.error('[CreditReset] Error running credit reset task:', error);
    // Don't throw - we want the task to continue running even if one execution fails
  }
}

/**
 * Start the credit reset scheduler
 * Runs daily at 2 AM UTC
 */
export function startCreditResetScheduler(): void {
  // Calculate milliseconds until next 2 AM UTC
  const now = new Date();
  const next2AM = new Date(now);
  next2AM.setUTCHours(2, 0, 0, 0);
  
  // If 2 AM has already passed today, schedule for tomorrow
  if (next2AM <= now) {
    next2AM.setUTCDate(next2AM.getUTCDate() + 1);
  }
  
  const msUntilNext2AM = next2AM.getTime() - now.getTime();
  
  console.log(`[CreditReset] Scheduler started. Next run at ${next2AM.toISOString()}`);
  
  // Schedule first run
  setTimeout(() => {
    runCreditResetTask();
    
    // Then run every 24 hours
    setInterval(runCreditResetTask, 24 * 60 * 60 * 1000);
  }, msUntilNext2AM);
}
