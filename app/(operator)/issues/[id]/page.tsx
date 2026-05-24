import { BackBar } from "@/components/shell/BackBar";

interface Props { params: Promise<{ id: string }> }

export default async function IssueInspectorPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <BackBar label="Visible-for" href="/visible/1" title="Issue Inspector" />
      <div className="p-6">
        <p className="text-sm" style={{ color: "var(--ink-4)" }}>Issue inspector for issue {id} — coming in Slice 3.</p>
      </div>
    </>
  );
}
