/**
 * Transações mock para o motor de conciliação.
 *
 * Cada transação agrupa até três origens (POS, ERP/Presence Domain, Banco).
 * Cada origem: { present, amount, date, nsu, storeId }.
 *
 * Cada transação também traz `items`: o detalhamento do pedido
 * (produto, quantidade e valor unitário). A soma de qtd × valorUnit dos itens
 * corresponde ao valor da venda (amount / origem POS).
 *
 * O lote foi montado de propósito para exercitar todas as faixas de confiança:
 *  - casamentos perfeitos (alta)
 *  - pequenas divergências de valor/data (alta/média)
 *  - NSU duplicado (baixa — suspeita de fraude/digitação)
 *  - loja inconsistente (média/baixa)
 *  - fonte faltante (banco não liquidou ainda)
 */

function src(storeId, amount, date, nsu, present = true) {
  return { present, amount, date, nsu, storeId };
}

function item(produto, qtd, valorUnit) {
  return { produto, qtd, valorUnit };
}

const transactions = [
  // 1 — casamento perfeito (ALTA)
  {
    id: 'TX0001', storeId: 'L001', storeName: 'BH Centro', date: '2026-07-01', amount: 890.0, nsu: 'NSU100001',
    method: 'credito', brand: 'Visa',
    items: [
      item('Armação Ray-Ban RB3025', 1, 550.0),
      item('Par de lentes antirreflexo', 1, 340.0),
    ],
    sources: {
      pos: src('L001', 890.0, '2026-07-01', 'NSU100001'),
      erp: src('L001', 890.0, '2026-07-01', 'NSU100001'),
      banco: src('L001', 890.0, '2026-07-01', 'NSU100001'),
    },
  },
  // 2 — perfeito (ALTA)
  {
    id: 'TX0002', storeId: 'L002', storeName: 'Savassi', date: '2026-07-01', amount: 1250.5, nsu: 'NSU100002',
    method: 'debito', brand: 'Mastercard',
    items: [
      item('Armação Chilli Beans acetato', 1, 350.5),
      item('Par de lentes multifocais', 1, 900.0),
    ],
    sources: {
      pos: src('L002', 1250.5, '2026-07-01', 'NSU100002'),
      erp: src('L002', 1250.5, '2026-07-01', 'NSU100002'),
      banco: src('L002', 1250.5, '2026-07-01', 'NSU100002'),
    },
  },
  // 3 — data do banco 1 dia depois (liquidação) — ALTA (parcial em data)
  {
    id: 'TX0003', storeId: 'L003', storeName: 'Contagem', date: '2026-07-01', amount: 430.0, nsu: 'NSU100003',
    method: 'credito', brand: 'Elo',
    items: [
      item('Óculos de sol Mormaii', 1, 430.0),
    ],
    sources: {
      pos: src('L003', 430.0, '2026-07-01', 'NSU100003'),
      erp: src('L003', 430.0, '2026-07-01', 'NSU100003'),
      banco: src('L003', 430.0, '2026-07-02', 'NSU100003'),
    },
  },
  // 4 — diferença de centavos (taxa) — ALTA (parcial em valor)
  {
    id: 'TX0004', storeId: 'L005', storeName: 'Uberlândia', date: '2026-07-02', amount: 599.9, nsu: 'NSU100004',
    method: 'credito', brand: 'Visa',
    items: [
      item('Armação metal infantil', 1, 299.9),
      item('Par de lentes Transitions', 1, 300.0),
    ],
    sources: {
      pos: src('L005', 599.9, '2026-07-02', 'NSU100004'),
      erp: src('L005', 599.9, '2026-07-02', 'NSU100004'),
      banco: src('L005', 599.4, '2026-07-02', 'NSU100004'),
    },
  },
  // 5 — divergência de valor relevante (MÉDIA)
  {
    id: 'TX0005', storeId: 'L004', storeName: 'Betim', date: '2026-07-02', amount: 2100.0, nsu: 'NSU100005',
    method: 'credito', brand: 'Mastercard',
    items: [
      item('Armação premium titânio', 1, 700.0),
      item('Par de lentes multifocais Transitions', 1, 1400.0),
    ],
    sources: {
      pos: src('L004', 2100.0, '2026-07-02', 'NSU100005'),
      erp: src('L004', 2100.0, '2026-07-02', 'NSU100005'),
      banco: src('L004', 1890.0, '2026-07-02', 'NSU100005'),
    },
  },
  // 6 — banco ainda não liquidou (fonte faltante) — MÉDIA
  {
    id: 'TX0006', storeId: 'L006', storeName: 'Juiz de Fora', date: '2026-07-03', amount: 745.0, nsu: 'NSU100006',
    method: 'credito', brand: 'Hipercard',
    items: [
      item('Armação acetato feminina', 1, 345.0),
      item('Par de lentes antirreflexo', 1, 400.0),
    ],
    sources: {
      pos: src('L006', 745.0, '2026-07-03', 'NSU100006'),
      erp: src('L006', 745.0, '2026-07-03', 'NSU100006'),
      banco: src('L006', 0, '', '', false),
    },
  },
  // 7 — loja inconsistente: vendida em L007 mas lançada no ERP como L008 (MÉDIA/BAIXA)
  {
    id: 'TX0007', storeId: 'L007', storeName: 'Montes Claros', date: '2026-07-03', amount: 1680.0, nsu: 'NSU100007',
    method: 'credito', brand: 'Visa',
    items: [
      item('Armação de grau masculina', 1, 680.0),
      item('Par de lentes multifocais', 1, 1000.0),
    ],
    sources: {
      pos: src('L007', 1680.0, '2026-07-03', 'NSU100007'),
      erp: src('L008', 1680.0, '2026-07-03', 'NSU100007'),
      banco: src('L007', 1680.0, '2026-07-04', 'NSU100007'),
    },
  },
  // 8 — NSU duplicado com TX0009 (BAIXA — suspeita de fraude/digitação)
  {
    id: 'TX0008', storeId: 'L009', storeName: 'Gov. Valadares', date: '2026-07-04', amount: 320.0, nsu: 'NSU100008',
    method: 'debito', brand: 'Elo',
    items: [
      item('Lente de contato mensal (caixa)', 2, 150.0),
      item('Solução para lentes 120ml', 1, 20.0),
    ],
    sources: {
      pos: src('L009', 320.0, '2026-07-04', 'NSU100008'),
      erp: src('L009', 320.0, '2026-07-04', 'NSU100008'),
      banco: src('L009', 320.0, '2026-07-04', 'NSU100008'),
    },
  },
  // 9 — NSU duplicado (mesmo NSU100008) + divergência de valor (BAIXA)
  {
    id: 'TX0009', storeId: 'L010', storeName: 'Ipatinga', date: '2026-07-04', amount: 980.0, nsu: 'NSU100008',
    method: 'credito', brand: 'Mastercard',
    items: [
      item('Armação acetato masculina', 1, 480.0),
      item('Par de lentes antirreflexo', 1, 500.0),
    ],
    sources: {
      pos: src('L010', 980.0, '2026-07-04', 'NSU100008'),
      erp: src('L010', 1100.0, '2026-07-04', 'NSU100008'),
      banco: src('L010', 0, '', '', false),
    },
  },
  // 10 — perfeito franquia (ALTA)
  {
    id: 'TX0010', storeId: 'F001', storeName: 'Divinópolis', date: '2026-07-04', amount: 1499.0, nsu: 'NSU100010',
    method: 'credito', brand: 'Visa',
    items: [
      item('Armação de sol premium', 1, 899.0),
      item('Par de lentes polarizadas', 1, 600.0),
    ],
    sources: {
      pos: src('F001', 1499.0, '2026-07-04', 'NSU100010'),
      erp: src('F001', 1499.0, '2026-07-04', 'NSU100010'),
      banco: src('F001', 1499.0, '2026-07-05', 'NSU100010'),
    },
  },
  // 11 — loja divergente + valor divergente + data divergente (BAIXA crítica)
  {
    id: 'TX0011', storeId: 'F002', storeName: 'Sete Lagoas', date: '2026-07-05', amount: 3200.0, nsu: 'NSU100011',
    method: 'credito', brand: 'Mastercard',
    items: [
      item('Armação de grau (par de óculos)', 2, 800.0),
      item('Par de lentes multifocais', 2, 800.0),
    ],
    sources: {
      pos: src('F002', 3200.0, '2026-07-05', 'NSU100011'),
      erp: src('F003', 2800.0, '2026-07-08', 'NSU100011'),
      banco: src('F002', 3200.0, '2026-07-05', 'NSU100011'),
    },
  },
  // 12 — perfeito (ALTA)
  {
    id: 'TX0012', storeId: 'F004', storeName: 'Pouso Alegre', date: '2026-07-05', amount: 675.0, nsu: 'NSU100012',
    method: 'pix', brand: 'Pix',
    items: [
      item('Armação acetato colorida', 1, 275.0),
      item('Par de lentes antirreflexo', 1, 400.0),
    ],
    sources: {
      pos: src('F004', 675.0, '2026-07-05', 'NSU100012'),
      erp: src('F004', 675.0, '2026-07-05', 'NSU100012'),
      banco: src('F004', 675.0, '2026-07-05', 'NSU100012'),
    },
  },
  // 13 — só POS (sem ERP e sem banco) — BAIXA (venda não lançada)
  {
    id: 'TX0013', storeId: 'L001', storeName: 'BH Centro', date: '2026-07-05', amount: 210.0, nsu: 'NSU100013',
    method: 'dinheiro', brand: 'Dinheiro',
    items: [
      item('Óculos de sol casual', 1, 180.0),
      item('Estojo + kit de limpeza', 1, 30.0),
    ],
    sources: {
      pos: src('L001', 210.0, '2026-07-05', 'NSU100013'),
      erp: src('L001', 0, '', '', false),
      banco: src('L001', 0, '', '', false),
    },
  },
  // 14 — perfeito (ALTA)
  {
    id: 'TX0014', storeId: 'L002', storeName: 'Savassi', date: '2026-07-06', amount: 1850.0, nsu: 'NSU100014',
    method: 'credito', brand: 'Visa',
    items: [
      item('Armação premium acetato', 1, 650.0),
      item('Par de lentes multifocais Transitions', 1, 1200.0),
    ],
    sources: {
      pos: src('L002', 1850.0, '2026-07-06', 'NSU100014'),
      erp: src('L002', 1850.0, '2026-07-06', 'NSU100014'),
      banco: src('L002', 1850.0, '2026-07-06', 'NSU100014'),
    },
  },
  // 15 — pequena diferença de valor (parcial) — ALTA
  {
    id: 'TX0015', storeId: 'L008', storeName: 'Uberaba', date: '2026-07-06', amount: 450.75, nsu: 'NSU100015',
    method: 'credito', brand: 'Elo',
    items: [
      item('Armação metal redonda', 1, 250.75),
      item('Par de lentes antirreflexo', 1, 200.0),
    ],
    sources: {
      pos: src('L008', 450.75, '2026-07-06', 'NSU100015'),
      erp: src('L008', 450.75, '2026-07-06', 'NSU100015'),
      banco: src('L008', 450.0, '2026-07-07', 'NSU100015'),
    },
  },
];

module.exports = { transactions };
