import { useState } from 'react';
import ConfidenceBadge from './ConfidenceBadge.jsx';
import { api } from '../api/client.js';
import { brl, ptDate, ptDateTime } from '../lib/format.js';

const CRIT_LABELS = {
  valueMatch: 'Valor bate',
  dateMatch: 'Data bate',
  nsuUnique: 'NSU único',
  storeConsistent: 'Loja consistente',
};

const STATUS_COLOR = {
  pass: 'bg-emerald-500',
  partial: 'bg-amber-500',
  fail: 'bg-red-500',
};

const METHOD_LABELS = {
  credito: 'Crédito',
  debito: 'Débito',
  pix: 'Pix',
  dinheiro: 'Dinheiro',
};

// Painel de detalhe/auditoria de uma transação. Reutilizado pela fila de
// exceções e pela página de todas as transações.
export default function TransactionDetail({ tx, onActionDone }) {
  const r = tx.reconciliation;
  const sources = tx.sources;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{tx.storeName}</h2>
          <div className="text-xs text-slate-400">
            {tx.id} · {tx.storeId} · NSU {tx.nsu || '—'}
          </div>
        </div>
        <ConfidenceBadge band={r.band} score={r.score} />
      </div>

      {/* Motivo explicável (sugestão do agente de IA) */}
      <div className={`rounded-md border px-4 py-3 text-sm ${
        r.band === 'low' ? 'border-red-200 bg-red-50 text-red-700'
        : r.band === 'medium' ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}>
        <span className="font-semibold">Sugestão do agente de IA: </span>{r.reason}
      </div>

      {/* Comparação POS x ERP x Banco lado a lado */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-600">Comparação por fonte</h3>
        <div className="grid grid-cols-3 gap-3">
          <SourceCard title="POS" subtitle="Caixa" s={sources.pos} payment={{ method: tx.method, brand: tx.brand }} />
          <SourceCard title="ERP" subtitle="Presence Domain" s={sources.erp} />
          <SourceCard title="Banco" subtitle="Extrato/adquirente" s={sources.banco} />
        </div>
      </div>

      {/* Barras por critério de confiança */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-600">Critérios de confiança</h3>
        <div className="space-y-3">
          {r.breakdown.map((b) => (
            <div key={b.criterion}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{CRIT_LABELS[b.criterion]}</span>
                <span className="font-mono text-slate-400">
                  {b.score}/{b.maxScore} pts
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full ${STATUS_COLOR[b.status]}`}
                  style={{ width: `${b.maxScore ? (b.score / b.maxScore) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-500">{b.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalhamento do pedido: produtos, quantidades e valores */}
      {tx.items && tx.items.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-600">Detalhamento do pedido</h3>
          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                  <th className="px-3 py-2 font-medium">Produto</th>
                  <th className="px-3 py-2 text-center font-medium">Qtd</th>
                  <th className="px-3 py-2 text-right font-medium">Valor unit.</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {tx.items.map((it, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{it.produto}</td>
                    <td className="px-3 py-2 text-center font-mono text-slate-600">{it.qtd}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-600">{brl(it.valorUnit)}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700">{brl(it.qtd * it.valorUnit)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td className="px-3 py-2 text-xs font-semibold uppercase text-slate-500" colSpan="3">
                    Total do pedido
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                    {brl(tx.items.reduce((s, it) => s + it.qtd * it.valorUnit, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {(() => {
            const itemsTotal = +tx.items.reduce((s, it) => s + it.qtd * it.valorUnit, 0).toFixed(2);
            const posAmount = tx.sources.pos && tx.sources.pos.present ? tx.sources.pos.amount : tx.amount;
            return itemsTotal !== posAmount ? (
              <div className="mt-2 text-xs text-amber-700">
                Atenção: a soma dos itens ({brl(itemsTotal)}) difere do valor no POS ({brl(posAmount)}).
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Ações */}
      <ActionBar tx={tx} onActionDone={onActionDone} />

      {/* Auditoria */}
      {tx.audit && tx.audit.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-600">Histórico de auditoria</h3>
          <ul className="space-y-2 text-xs">
            {tx.audit.map((a) => (
              <li key={a.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">{a.label}</span> · por {a.user} ·{' '}
                {ptDateTime(a.at)}
                {a.reason && <div className="text-slate-500">Motivo: {a.reason}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PaymentChip({ method, brand }) {
  const label = METHOD_LABELS[method] || method;
  return (
    <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2">
      <span className="rounded bg-brand-blue/10 px-1.5 py-0.5 text-[11px] font-semibold text-brand-blue">
        {label}
      </span>
      {brand && method !== 'dinheiro' && (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
          {brand}
        </span>
      )}
    </div>
  );
}

function SourceCard({ title, subtitle, s, payment }) {
  const present = s && s.present;
  return (
    <div className={`rounded-md border p-3 text-sm ${present ? 'border-slate-200' : 'border-dashed border-slate-200 bg-slate-50'}`}>
      <div className="flex items-baseline justify-between">
        <span className="font-semibold text-slate-700">{title}</span>
        <span className="text-[10px] uppercase text-slate-400">{subtitle}</span>
      </div>
      {present ? (
        <>
          <dl className="mt-2 space-y-1 text-xs">
            <Row k="Valor" v={brl(s.amount)} mono />
            <Row k="Data" v={ptDate(s.date)} />
            <Row k="NSU" v={s.nsu || '—'} mono />
            <Row k="Loja" v={s.storeId} />
          </dl>
          {payment && payment.method && <PaymentChip method={payment.method} brand={payment.brand} />}
        </>
      ) : (
        <div className="mt-3 text-xs italic text-slate-400">Sem registro nesta fonte</div>
      )}
    </div>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-400">{k}</dt>
      <dd className={`text-slate-700 ${mono ? 'font-mono' : ''}`}>{v}</dd>
    </div>
  );
}

const ACTIONS = [
  { key: 'aprovar', label: 'Aprovar casamento', cls: 'bg-emerald-600 hover:bg-emerald-700' },
  { key: 'fraude', label: 'Suspeita de fraude', cls: 'bg-red-600 hover:bg-red-700' },
  { key: 'pedir_dados', label: 'Pedir dados à loja', cls: 'bg-brand-blue hover:bg-brand-teal' },
];

function ActionBar({ tx, onActionDone }) {
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  async function run(action) {
    const reason = window.prompt('Justificativa (registrada na auditoria):', '');
    if (reason === null) return; // cancelou
    setBusy(action);
    setMsg(null);
    try {
      await api.postAction(tx.id, {
        action,
        user: 'operador',
        reason,
        scoreAtDecision: tx.reconciliation.score,
        band: tx.reconciliation.band,
      });
      setMsg('Ação registrada com auditoria.');
      onActionDone && onActionDone();
    } catch (e) {
      setMsg(`Falha: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {tx.decision && (
        <div className="mb-2 text-xs text-slate-500">
          Decisão atual: <span className="font-medium text-slate-700">{tx.decision}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            disabled={busy !== null}
            onClick={() => run(a.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${a.cls}`}
          >
            {busy === a.key ? '…' : a.label}
          </button>
        ))}
      </div>
      {msg && <div className="mt-2 text-xs text-slate-500">{msg}</div>}
    </div>
  );
}
