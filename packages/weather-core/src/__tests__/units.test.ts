import { describe, expect, it } from 'vitest';
import { celsiusToFahrenheit, kphToMph, mmToInches } from '../units.js';
import { describeWeatherCode } from '../weather-codes.js';

describe('units', () => {
  it('converts celsius to fahrenheit', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
  });

  it('converts kph to mph', () => {
    expect(kphToMph(100)).toBe(62);
  });

  it('converts mm to inches', () => {
    expect(mmToInches(25.4)).toBe(1);
  });
});

describe('weather codes', () => {
  it('describes known codes', () => {
    expect(describeWeatherCode(0).label).toBe('Clear sky');
  });

  it('falls back for unknown codes', () => {
    expect(describeWeatherCode(999).label).toBe('Unknown');
  });
});
