export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

export function kphToMph(kph: number): number {
  return Math.round(kph * 0.621371);
}

export function mmToInches(mm: number): number {
  return Math.round((mm / 25.4) * 100) / 100;
}
