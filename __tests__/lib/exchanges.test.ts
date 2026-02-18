import { getExchangesForCountry } from '@/lib/constants/exchanges';

describe('getExchangesForCountry', () => {
  it('includes Flash for Jamaica', () => {
    const { regional } = getExchangesForCountry('JM');
    expect(regional.some((exchange) => exchange.id === 'flash')).toBe(true);
  });

  it('does not include Flash for non-Jamaica countries', () => {
    const { regional } = getExchangesForCountry('US');
    expect(regional.some((exchange) => exchange.id === 'flash')).toBe(false);
  });
});
