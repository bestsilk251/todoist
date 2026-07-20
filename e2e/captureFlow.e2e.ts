/* eslint-env detox/detox, jest */

describe('Capture flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('captures, confirms, and lists a task', async () => {
    await element(by.id('capture-input')).typeText('buy milk tomorrow');
    await element(by.id('add-button')).tap();

    await waitFor(element(by.id('save-button')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('save-button')).tap();

    await waitFor(element(by.text('Buy milk')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
