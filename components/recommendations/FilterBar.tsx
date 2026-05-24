"use client";

interface FilterBarProps {
  wave: string;
  status: string;
  onWave: (v: string) => void;
  onStatus: (v: string) => void;
}

const waveOptions = [
  { label: "All", value: "all" },
  { label: "Wave 1", value: "1" },
  { label: "Wave 2", value: "2" },
  { label: "Wave 3", value: "3" },
];

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Done", value: "done" },
  { label: "Won't Fix", value: "wontfix" },
];

function chipStyle(active: boolean): React.CSSProperties {
  if (active) {
    return { background: "var(--indigo)", color: "#fff" };
  }
  return {
    background: "var(--bg-2)",
    color: "var(--ink-4)",
    border: "1px solid var(--line-2)",
  };
}

export function FilterBar({ wave, status, onWave, onStatus }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium shrink-0" style={{ color: "var(--ink-4)", minWidth: 44 }}>
          Wave
        </span>
        {waveOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onWave(opt.value)}
            className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
            style={chipStyle(wave === opt.value)}
            onMouseEnter={(e) => {
              if (wave !== opt.value) {
                e.currentTarget.style.background = "var(--indigo-tint)";
                e.currentTarget.style.color = "var(--indigo)";
              }
            }}
            onMouseLeave={(e) => {
              if (wave !== opt.value) {
                const s = chipStyle(false);
                e.currentTarget.style.background = s.background as string;
                e.currentTarget.style.color = s.color as string;
              }
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium shrink-0" style={{ color: "var(--ink-4)", minWidth: 44 }}>
          Status
        </span>
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatus(opt.value)}
            className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
            style={chipStyle(status === opt.value)}
            onMouseEnter={(e) => {
              if (status !== opt.value) {
                e.currentTarget.style.background = "var(--indigo-tint)";
                e.currentTarget.style.color = "var(--indigo)";
              }
            }}
            onMouseLeave={(e) => {
              if (status !== opt.value) {
                const s = chipStyle(false);
                e.currentTarget.style.background = s.background as string;
                e.currentTarget.style.color = s.color as string;
              }
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
