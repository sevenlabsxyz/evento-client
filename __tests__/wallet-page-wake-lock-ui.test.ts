import fs from 'fs';
import path from 'path';

describe('wallet page wake lock UI', () => {
  it('does not show user-facing wake lock informational toasts', () => {
    const walletPageSource = fs.readFileSync(
      path.join(process.cwd(), 'app/e/wallet/page.tsx'),
      'utf8'
    );

    expect(walletPageSource).not.toContain('Keep Screen Awake Unavailable');
    expect(walletPageSource).not.toContain(
      'This browser cannot keep the wallet screen awake automatically.'
    );
    expect(walletPageSource).not.toContain(
      'Your device would not keep the wallet screen awake right now. Battery saver or browser restrictions may be blocking it.'
    );
  });
});
