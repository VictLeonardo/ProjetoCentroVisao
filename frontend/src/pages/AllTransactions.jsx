import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import TransactionDetail from '../components/TransactionDetail.jsx';
import { Loading, ErrorBox } from './Dashboard.jsx';
import { brl, ptDate } from '../lib/format.js';

// Rótulo de situação a partir da faixa de confiança.
const STATUS = {
  high: { label: 'Conciliada (auto)', cls: 'bg-emerald-100 text-emerald-700' },
  medium: { label: 'Em revisão', cls: 'bg-amber-100 text-amber-700' },
  low: { label: 'Crítica', cls: 'bg-red-100 text-red-700' },
};

export default function AllTransactions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadList = useCallback(() => {
    api.getTransactions().then(setList).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (id) api.getTransaction(id).then(setDetail).catch((e) => setError(e.message));
    else setDetail(null);
  }, [id]);

  const counts = useMemo(() => {
    if (!list) return { all: 0, auto: 0, review: 0 };
    return {
      all: list.length,
      auto: list.filter((t) => t.reconciliation.band === 'high').length,
      review: list.filter((t) => t.reconciliation.band !== 'high').length,
    };
  }, [list]);

  const shown = useMemo(() => {
    if (!list) return [];
    if (filter === 'auto') return list.filter((t) => t.reconciliation.band === 'high');
    if (filter === 'review') return list.filter((t) => t.reconciliation.band !== 'high');
    return list;
  }, [list, filter]);

  if (error) return <ErrorBox message={error} />;
  if (!list) return <Loading />;

  const filters = [
    { key: 'all', label: `Todas (${counts.all})` },
    { key: 'auto', label: `Conciliadas auto (${counts.auto})` },
    { key: 'review', label: `Em revisão (${counts.review})` },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Todas as transações</h1>
        <p className="text-sm text-slate-500">
          As {counts.all} transações do lote — inclusive as conciliadas automaticamente. Toda operação
          é auditável: abra e registre uma decisão a qualquer momento.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-brand-blue text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Lista */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <ul className="max-h-[72vh] divide-y divide-slate-100 overflow-y-auto">
            {shown.map((t) => {
              const st = STATUS[t.reconciliation.band];
              return (
                <li key={t.id}>
                  <button
                    onClick={() => navigate(`/transacoes/${t.id}`)}
                    className={`flex w-full items-start justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50 ${
                      id === t.id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-700">{t.storeName}</div>
                      <div className="text-xs text-slate-400">
                        {t.id} · {brl(t.amount)} · {ptDate(t.date)}
                      </div>
                      <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <ConfidenceBadge band={t.reconciliation.band} score={t.reconciliation.score} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Detalhe */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          {detail ? (
            <TransactionDetail
              tx={detail}
              onActionDone={() => { loadList(); api.getTransaction(id).then(setDetail); }}
            />
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-slate-400">
              Selecione uma transação à esquerda para revisar e auditar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
