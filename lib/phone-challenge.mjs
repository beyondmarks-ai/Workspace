export async function waitForPhoneChallenge(verifier, timeoutMs = 120000) {
  let timer;
  try {
    await Promise.race([
      verifier.verify(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Google verification did not finish. Please retry, or use email sign-in.')), timeoutMs);
      }),
    ]);
  } catch (error) {
    verifier.clear();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
