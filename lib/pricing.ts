// Lógica de cálculo de preços por pacote e duração para as unidades
// Conforme solicitado pelo cliente:
//
// CANDEIAS / SETUBAL
// - Avulso 1h30 (90 min): R$ 300,00
// - Avulso 2h (120 min): R$ 400,00
// - Festa 3h (180 min): R$ 700,00
// - Festa 4h (240 min): R$ 850,00
//
// JANGA
// - Avulso 1h30 (90 min): R$ 280,00
// - Avulso 2h (120 min): R$ 350,00
// - Festa 3h (180 min): R$ 450,00
// - Festa 4h (240 min): R$ 550,00
//
// INTERNACIONAL / SPORT / CLUBE DOS OFICIAIS / ARRAIAL
// - Avulso 1h (60 min): R$ 250,00
// - Avulso 1h30 (90 min): R$ 370,00
// - Festa 3h (180 min): R$ 850,00
// - Festa 4h (240 min): R$ 1000,00

export function getFieldPrice(fieldName: string, durationMinutes: number, hourlyRateFallback: number): number {
  const name = fieldName.toLowerCase();

  // CANDEIAS e SETUBAL
  if (name.includes('candeias') || name.includes('setúbal') || name.includes('setubal')) {
    if (durationMinutes === 90) return 300;
    if (durationMinutes === 120) return 400;
    if (durationMinutes === 180) return 700;
    if (durationMinutes === 240) return 850;
  }

  // JANGA
  if (name.includes('janga')) {
    if (durationMinutes === 90) return 280;
    if (durationMinutes === 120) return 350;
    if (durationMinutes === 180) return 450;
    if (durationMinutes === 240) return 550;
  }

  // INTERNACIONAL / SPORT / CLUBE DOS OFICIAIS / ARRAIAL
  if (
    name.includes('internacional') ||
    name.includes('sport') ||
    name.includes('oficiais') ||
    name.includes('arraial')
  ) {
    if (durationMinutes === 60) return 250;
    if (durationMinutes === 90) return 370;
    if (durationMinutes === 180) return 850;
    if (durationMinutes === 240) return 1000;
  }

  // Fallback para cálculo linear baseado no hourly_rate caso seja outra duração ou campo
  return (hourlyRateFallback * durationMinutes) / 60;
}
