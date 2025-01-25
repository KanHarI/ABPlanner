// eslint-disable-next-line @typescript-eslint/no-require-imports
const cephes = require('cephes');

// Await the compilation of the cephes library
export async function awaitReady(): Promise<void> {
  await cephes.compiled;
}
