import Icon from '../Icon';

interface Props {
  page: number; // começa em 1
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const pageSizes = [5, 10, 20];

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const nav = 'grid h-9 w-9 place-items-center rounded-full bg-surface transition hover:bg-black/10 disabled:opacity-30';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 p-4 text-sm text-muted">
      <label className="flex items-center gap-2">
        Por página
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-ink">
          {pageSizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <span>{from}–{to} de {total}</span>
      <div className="flex items-center gap-2">
        <button aria-label="Página anterior" className={nav} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <Icon name="left" className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center">{page} / {pages}</span>
        <button aria-label="Próxima página" className={nav} disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          <Icon name="right" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
