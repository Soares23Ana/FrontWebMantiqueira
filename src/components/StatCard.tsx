interface Props {
  label: string;
  value: number;
  highlight?: boolean;
}

export default function StatCard({ label, value, highlight = false }: Props) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight && value > 0 ? 'border-accent bg-accent/5' : 'border-black/10 bg-white'}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${highlight && value > 0 ? 'text-accent' : 'text-brand'}`}>{value}</p>
    </div>
  );
}
