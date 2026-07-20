import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import ConfidenceBadge from '../components/ConfidenceBadge.jsx';
import TransactionDetail from '../components/TransactionDetail.jsx';
import { Loading, ErrorBox } from './Dashboard.jsx';
import { brl, ptDate } from '../lib/format.js';

export default function Exceptions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  const loadList = useCallback(() => {
    api.getExceptions().then(setList).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (id) {
      api.getTransaction(id).then(setDetail).catch((e) => setError(e.message));
    } else {
      setDetail(null);
    }
  }, [id]);

  if (error) return <ErrorBox message={error} />;
  if (!list) return <Loading />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Fila de exceções</h1>
        <p className="text-sm text-slate-500">
          Transações que não conciliaram automaticamente — clique para revisar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Lista à esquerda */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2 text-xs uppercase text-slate-400">
            {list.length} exceção(ões)
          </div>
          <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
            {list.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => navigate(`/excecoes/${t.id}`)}
                  className={`flex w-full items-start justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50 ${
                    id === t.id ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-700">{t.storeName}</div>
                    <div className="text-xs text-slate-400">
                      {brl(t.amount)} · {ptDate(t.date)}
                    </div>
                  </div>
                  <ConfidenceBadge band={t.reconciliation.band} score={t.reconciliation.score} />
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-400">Nada pendente 🎉</li>
            )}
          </ul>
        </div>

        {/* Detalhe à direita */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          {detail ? (
            <TransactionDetail
              tx={detail}
              onActionDone={() => { loadList(); api.getTransaction(id).then(setDetail); }}
            />
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-slate-400">
              Selecione uma exceção à esquerda para ver o detalhamento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
