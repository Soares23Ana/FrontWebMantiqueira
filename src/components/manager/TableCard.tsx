import type { ReactNode } from 'react';

interface Props {
  headers: string[];
  empty: string;
  isEmpty: boolean;
  children: ReactNode; // linhas <tr>
  footer?: ReactNode;
}

export default function TableCard({ headers, empty, isEmpty, children, footer }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-surface text-sm text-muted">
            <tr>{headers.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="[&>tr]:border-t [&>tr]:border-black/10">{children}</tbody>
        </table>
      </div>
      {isEmpty && <p className="p-8 text-center text-muted">{empty}</p>}
      {footer}
    </div>
  );
}
