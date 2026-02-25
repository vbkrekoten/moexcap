// Number formatting with Russian suffixes
export function fmtNum(n: number | null | undefined, dec = 0): string {
  if (n == null || isNaN(n)) return '\u2014';
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(1) + ' \u0442\u0440\u043b\u043d';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + ' \u043c\u043b\u0440\u0434';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + ' \u043c\u043b\u043d';
  return n.toLocaleString('ru-RU', { maximumFractionDigits: dec });
}

// Percent formatting with sign
export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '\u2014';
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
}

// Date formatting (Russian locale)
export function fmtDate(d: string | null | undefined): string {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('ru-RU');
}

// Short month-year: "2024-03" → "мар 24"
export function fmtMonthShort(d: string): string {
  const months = [
    'янв', 'фев', 'мар', 'апр', 'май', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
  ];
  const [y, m] = d.split('-');
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}
