import { BackBar } from "@/components/shell/BackBar";

interface Props { params: Promise<{ id: string }> }

export default async function FixDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <BackBar label="Recommendations" href="/recommendations" title="Fix Detail" />
      <div className="p-6">
        <p className="text-sm" style={{ color: "var(--ink-4)" }}>Fix detail for recommendation {id} — coming in Slice 3.</p>
      </div>
    </>
  );
}
