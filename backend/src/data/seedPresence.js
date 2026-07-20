/**
 * Mapa de presença por loja (mock).
 *
 * Fase futura do módulo de câmeras: métricas de cliente (fluxo de pessoas).
 * Aqui geramos, de forma determinística por loja, uma matriz
 * dias × horários com a intensidade de presença (pessoas/hora estimadas),
 * além de insights prontos (pico, dia mais/menos movimentado, sugestões).
 *
 * Como é determinístico (seed a partir do id da loja), os números são
 * estáveis entre execuções. Quando as câmeras via API entrarem, este
 * repositório é trocado pela contagem real (mesma interface).
 */

const { stores } = require('./seedStores');

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

// perfil típico de ótica: manhã cresce, cai no almoço, pico no fim da tarde
const HOUR_W = { 9: 0.45, 10: 0.8, 11: 1.0, 12: 0.6, 13: 0.5, 14: 0.8, 15: 0.92, 16: 1.0, 17: 0.82, 18: 0.55 };
const DAY_W = { Seg: 0.7, Ter: 0.72, Qua: 0.8, Qui: 0.85, Sex: 1.0, 'Sáb': 1.25 };

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildPresence(store) {
  const seed = hash(store.id);
  const base = store.type === 'propria' ? 22 : 16;
  const factor = 0.8 + (seed % 40) / 100; // 0.80 .. 1.19

  let peak = { value: -1 };
  let quiet = { value: Infinity };
  const dayTotals = {};

  const grid = DAYS.map((day, di) => {
    const hours = HOURS.map((hour) => {
      const noise = ((seed >> ((di + (hour % 7)) % 24)) & 7) - 3; // -3 .. 4
      let value = Math.round(base * factor * DAY_W[day] * HOUR_W[hour] + noise);
      if (value < 0) value = 0;
      if (value > peak.value) peak = { day, hour, value };
      if (value < quiet.value) quiet = { day, hour, value };
      dayTotals[day] = (dayTotals[day] || 0) + value;
      return { hour, value };
    });
    return { day, hours };
  });

  const sortedDays = Object.entries(dayTotals).sort((a, b) => b[1] - a[1]);
  const busiestDay = sortedDays[0][0];
  const quietestDay = sortedDays[sortedDays.length - 1][0];
  const totalWeek = Object.values(dayTotals).reduce((a, b) => a + b, 0);
  const maxValue = peak.value;

  const insights = [
    `Pico de movimento: ${peak.day} às ${peak.hour}h (~${peak.value} pessoas/hora).`,
    `Dia mais movimentado: ${busiestDay}; dia mais fraco: ${quietestDay}.`,
    `Reforce a equipe em ${busiestDay} no fim da tarde; ${quietestDay} de manhã é a melhor janela para inventário e treinamentos.`,
  ];

  return {
    storeId: store.id,
    storeName: store.name,
    days: DAYS,
    hours: HOURS,
    grid,
    maxValue,
    totalWeek,
    peak,
    quiet,
    busiestDay,
    quietestDay,
    insights,
  };
}

const presence = {};
for (const store of stores) {
  presence[store.id] = buildPresence(store);
}

module.exports = { presence };
