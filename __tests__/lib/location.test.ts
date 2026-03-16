import { formatEventLocationAddress, getEventLocationDisplayLines } from '@/lib/utils/location';

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

  it('strips city/state/zip/country from full address string', () => {
    expect(
      getEventLocationDisplayLines(
        {
          name: '',
          address: '2070 Park Centre Dr, Las Vegas, NV 89135, USA',
          city: 'Las Vegas',
          state: 'Nevada',
          country: 'USA',
          zipCode: '89135',
        },
        {
          preferStructuredAddress: true,
        }
      )
    ).toEqual({
      primary: '2070 Park Centre Dr',
      secondary: 'Las Vegas, Nevada',
    });
  });

  it('strips city/state from address when they appear as suffixes', () => {
    expect(
      getEventLocationDisplayLines(
        {
          name: 'Some Place',
          address: '123 Main St, San Francisco, CA 94103, United States',
          city: 'San Francisco',
          state: 'CA',
          country: 'United States',
          zipCode: '94103',
        },
        {
          preferStructuredAddress: true,
        }
      )
    ).toEqual({
      primary: '123 Main St',
      secondary: 'San Francisco, CA',
    });
  });

  it('does not duplicate name or city in formatEventLocationAddress', () => {
    expect(
      formatEventLocationAddress({
        name: 'Av. Nhandú, 848',
        address: 'Av. Nhandú, 848 - Planalto Paulista, São Paulo - SP, 04059-002, Brazil',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brazil',
        zipCode: '04059-002',
      })
    ).toBe('Av. Nhandú, 848 - Planalto Paulista, São Paulo, SP, 04059-002, Brazil');
  });

  it('strips full address in formatEventLocationAddress', () => {
    expect(
      formatEventLocationAddress({
        name: '',
        address: '2070 Park Centre Dr, Las Vegas, NV 89135, USA',
        city: 'Las Vegas',
        state: 'Nevada',
        country: 'USA',
        zipCode: '89135',
      })
    ).toBe('2070 Park Centre Dr, Las Vegas, Nevada, 89135, USA');
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
