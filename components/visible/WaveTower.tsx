import { Lock } from "lucide-react";

interface WaveBlock {
  label: string;
  shaded: boolean;
  color: "green" | "amber" | "red" | "gray";
}

interface WaveTowerProps {
  waveNumber: 1 | 2 | 3;
  grade: string | null;
  blocks: WaveBlock[];
}

function blockStyle(color: WaveBlock["color"], shaded: boolean): React.CSSProperties {
  if (shaded) {
    return {
      background: "var(--bg-2)",
      borderColor: "var(--line-2)",
      color: "var(--ink-5)",
    };
  }
  switch (color) {
    case "green":
      return {
        background: "var(--green-tint)",
        borderColor: "var(--green)",
        color: "var(--green)",
      };
    case "amber":
      return {
        background: "var(--amber-tint)",
        borderColor: "var(--amber)",
        color: "var(--amber)",
      };
    case "red":
      return {
        background: "var(--red-tint)",
        borderColor: "var(--red)",
        color: "var(--red)",
      };
    case "gray":
      return {
        background: "var(--bg-2)",
        borderColor: "var(--line)",
        color: "var(--ink-4)",
      };
  }
}

function gradeStyle(grade: string | null): React.CSSProperties {
  if (!grade) {
    return { background: "var(--red-tint)", color: "var(--red)" };
  }
  if (grade.startsWith("A")) {
    return { background: "var(--green-tint)", color: "var(--green)" };
  }
  if (grade.startsWith("B")) {
    return { background: "var(--indigo-tint)", color: "var(--indigo)" };
  }
  if (grade.startsWith("C")) {
    return { background: "var(--amber-tint)", color: "var(--amber)" };
  }
  return { background: "var(--red-tint)", color: "var(--red)" };
}

export function WaveTower({ waveNumber, grade, blocks }: WaveTowerProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold" style={{ color: "var(--ink)" }}>
          Wave {waveNumber}
        </span>
        <span
          className="text-xs font-bold font-mono px-2 py-0.5 rounded-full"
          style={gradeStyle(grade)}
        >
          {grade ?? "—"}
        </span>
      </div>
      {blocks.map((block, i) => (
        <div
          key={i}
          className="flex items-center justify-center gap-1 border rounded-[var(--r-md)]"
          style={{
            height: 44,
            fontSize: 12,
            fontWeight: 600,
            ...blockStyle(block.color, block.shaded),
          }}
        >
          {block.shaded && <Lock size={11} />}
          <span>{block.label}</span>
        </div>
      ))}
    </div>
  );
}
