export default function Footer() {
  return (
    <footer className="text-center py-8 border-t border-gray-800 text-xs text-muted space-y-2 mt-6">
      <p>Данные: Supabase &bull; ISS MOEX &bull; ЦБ РФ &bull; FRED &bull; Alpha Vantage</p>
      <p>
        Дашборд анализирует акции ПАО &laquo;Московская биржа&raquo; (тикер MOEX, TQBR).
        Не является инвестиционной рекомендацией.
      </p>
      <p>
        <a
          href="https://www.moex.com/ru/ir"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:underline"
        >
          IR Московской биржи
        </a>
        {' \u2022 '}
        <a
          href="https://iss.moex.com/iss/reference/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:underline"
        >
          ISS API Reference
        </a>
      </p>
    </footer>
  );
}
