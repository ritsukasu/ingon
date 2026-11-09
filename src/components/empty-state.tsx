const TEMPLATES = [
  { title: "Explain how DNS works", sub: "like I'm new to networking" },
  { title: "Draft a polite message", sub: "declining a meeting" },
  { title: "Plan a 3-day budget trip", sub: "to Kyoto" },
  { title: "Debug my React code", sub: "why does useEffect run twice?" },
];

export function Welcome() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-xs rounded-lg border border-line bg-bg/60 p-4">
        <h2 className="mb-3 text-sm font-medium">Welcome!</h2>
        <p className="text-xs leading-5 text-muted">
          Get started by selecting one of the templates below or type your message in the input field.
        </p>
      </div>
    </div>
  );
}

export function Templates({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="grid shrink-0 grid-cols-1 gap-2 px-4 pb-3 sm:grid-cols-2">
      {TEMPLATES.map((t) => (
        <button
          key={t.title}
          type="button"
          onClick={() => onPick(`${t.title} ${t.sub}`)}
          className="rounded-lg border border-line bg-bg/60 px-3.5 py-2.5 text-left transition-colors hover:bg-accent-soft"
        >
          <span className="block text-xs font-medium">{t.title}</span>
          <span className="block text-xs text-muted">{t.sub}</span>
        </button>
      ))}
    </div>
  );
}
