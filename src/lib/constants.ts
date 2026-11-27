/**
 * Platform-wide constants. Admin UI for tuning these is on the post-launch roadmap.
 */

/** Minimum delivery fee for every errand request, enforced FE/BE/DB. */
export const MIN_DELIVERY_FEE = 500;

/** Withdrawal launch-phase limits (server-mirrored in process-withdrawal). */
export const MIN_WITHDRAWAL = 1000;
export const MAX_WITHDRAWAL = 1000000;

/** Add-money minimum. */
export const MIN_DEPOSIT = 1000;
