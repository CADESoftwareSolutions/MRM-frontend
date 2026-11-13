export const MAX_CHECK_AMOUNT = 999_999_999.99;

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

const SCALES: [number, string][] = [
  [1_000_000, "million"],
  [1_000, "thousand"],
];

const underOneThousand = (n: number): string => {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} hundred`);
  if (rest >= 20) parts.push(rest % 10 ? `${TENS[Math.floor(rest / 10)]}-${ONES[rest % 10]}` : TENS[rest / 10]);
  else if (rest) parts.push(ONES[rest]);
  return parts.join(" ");
};

const dollarsInWords = (dollars: number): string => {
  if (dollars === 0) return ONES[0];
  const parts: string[] = [];
  let remaining = dollars;
  for (const [size, label] of SCALES) {
    const group = Math.floor(remaining / size);
    if (group) parts.push(`${underOneThousand(group)} ${label}`);
    remaining %= size;
  }
  if (remaining) parts.push(underOneThousand(remaining));
  return parts.join(" ");
};

/** "Twelve thousand four hundred eighty and 00/100" — throws RangeError outside 0–999,999,999.99. */
export const amountInWords = (amount: number): string => {
  const totalCents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || totalCents < 0 || totalCents > Math.round(MAX_CHECK_AMOUNT * 100)) {
    throw new RangeError(`amountInWords: ${amount} is outside 0–${MAX_CHECK_AMOUNT}`);
  }
  const dollars = Math.floor(totalCents / 100);
  const cents = String(totalCents % 100).padStart(2, "0");
  const words = dollarsInWords(dollars);
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} and ${cents}/100`;
};
