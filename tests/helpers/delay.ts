/**
 * Wait utility for Firebase free-tier quota protection.
 * Use in beforeEach to add 500ms spacing between tests.
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((res) => setTimeout(res, ms));
