export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function average(a: number, b: number) {
  return (a + b) / 2;
}
