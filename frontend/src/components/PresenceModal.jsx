import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Cor da célula por intensidade (0..1) — escala em teal da marca (#3897AF).
function cellStyle(value, max) {
  const t = max ? value / max : 0;
  const alpha = 0.08 + 0.92 * t;
  return {
    backgroundColor: `rgba(56, 151, 175, ${alpha})`,
    color: t > 0.55 ? '#fff' : '#334155',
  };
}

export default function PresenceModal({ storeId, storeName, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.getPresence(storeId).then(setData).catch((e) => setError(e.message));
  }, [storeId]);

  // fecha no Esc
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-brand-teal">Mapa de presença</div>
            <h2 className="text-lg font-semibold text-slate-800">{storeName}</h2>
            <p className="text-xs text-slate-400">
              Fluxo estimado de pessoas por dia e horário (média semanal).
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {error && <div className="text-sm text-red-600">Erro ao carregar: {error}</div>}
          {!data && !error && <div className="py-10 text-center text-sm text-slate-400">Carregando…</div>}

          {data && (
            <>
              {/* KPIs */}
              <div className="mb-5 grid grid-cols-3 gap-3">
                <Kpi label="Pico" value={`${data.peak.day} ${data.peak.hour}h`} sub={`~${data.peak.value} pessoas/h`} />
                <Kpi label="Dia mais movimentado" value={data.busiestDay} sub="da semana" />
                <Kpi label="Movimento semanal" value={`${data.totalWeek}`} sub="pessoas (estim.)" />
              </div>

              {/* Heatmap */}
              <div className="overflow-x-auto">
                <table className="border-separate" style={{ borderSpacing: '3px' }}>
                  <thead>
                    <tr>
                      <th className="w-10"></th>
                      {data.hours.map((h) => (
                        <th key={h} className="px-1 pb-1 text-center text-[10px] font-medium text-slate-400">
                          {h}h
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.grid.map((row) => (
                      <tr key={row.day}>
                        <td className="pr-2 text-right text-xs font-medium text-slate-500">{row.day}</td>
                        {row.hours.map((cell) => (
                          <td
                            key={cell.hour}
                            title={`${row.day} ${cell.hour}h · ${cell.value} pessoas/h`}
                            className="h-8 w-10 rounded text-center align-middle font-mono text-[11px] tabular-nums"
                            style={cellStyle(cell.value, data.maxValue)}
                          >
                            {cell.value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legenda */}
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <span>menos</span>
                <div className="flex gap-1">
                  {[0.1, 0.3, 0.5, 0.7, 0.95].map((t) => (
                    <span key={t} className="h-3 w-6 rounded" style={{ backgroundColor: `rgba(56,151,175,${t})` }} />
                  ))}
                </div>
                <span>mais movimento</span>
              </div>

              {/* Insights */}
              <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Insights do agente
                </div>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {data.insights.map((ins, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
                      {ins}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-4 text-[11px] text-slate-400">
                Dados simulados nesta fase. Quando a contagem por câmera (API/IP) estiver ativa, este mapa
                passa a refletir a presença real de clientes na loja.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="text-base font-bold text-brand-blue">{value}</div>
      <div className="text-[11px] text-slate-400">{sub}</div>
    </div>
  );
}
