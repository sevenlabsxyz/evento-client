import { getEventLocationDisplayLines } from '@/lib/utils/location';

describe('getEventLocationDisplayLines', () => {
  it('prefers the street address and shows city/state on the second line', () => {
    expect(
      getEventLocationDisplayLines(
        {
          name: 'Home',
          address: '7414 Yonie Ct',
          city: 'Austin',
          state: 'TX',
          country: 'United States',
        },
        {
          preferStructuredAddress: true,
        }
      )
    ).toEqual({
      primary: '7414 Yonie Ct',
      secondary: 'Austin, TX',
    });
  });

  it('falls back to the location name when no street address exists', () => {
    expect(
      getEventLocationDisplayLines(
        {
          name: 'Moscone Center',
          address: '',
          city: 'San Francisco',
          state: 'CA',
          country: 'United States',
        },
        {
          preferStructuredAddress: true,
        }
      )
    ).toEqual({
      primary: 'Moscone Center',
      secondary: 'San Francisco, CA',
    });
  });

  it('falls back to country when state is unavailable', () => {
    expect(
      getEventLocationDisplayLines(
        {
          name: 'Tulum Beach',
          address: '',
          city: 'Tulum',
          country: 'Mexico',
        },
        {
          preferStructuredAddress: true,
        }
      )
    ).toEqual({
      primary: 'Tulum Beach',
      secondary: 'Tulum, Mexico',
    });
  });

  it('keeps manual one-part locations on a single line', () => {
    expect(
      getEventLocationDisplayLines(
        {
          name: 'Online',
          address: '',
          city: 'Online',
          country: '',
        },
        {
          fallbackLabel: 'Online',
        }
      )
    ).toEqual({
      primary: 'Online',
      secondary: '',
    });
  });

  it('keeps manual comma-separated locations on a single line', () => {
    expect(
      getEventLocationDisplayLines(
        {
          name: 'Austin',
          address: '',
          city: 'Austin',
          state: 'TX',
          country: '',
        },
        {
          fallbackLabel: 'Austin, TX',
        }
      )
    ).toEqual({
      primary: 'Austin, TX',
      secondary: '',
    });
  });

  it('keeps the TBD fallback when no location details exist', () => {
    expect(
      getEventLocationDisplayLines({
        name: 'TBD',
        address: '',
        city: '',
        country: '',
      })
    ).toEqual({
      primary: 'TBD',
      secondary: '',
    });
  });
});
