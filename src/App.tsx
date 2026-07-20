import { useState } from "react";
import { buildLineageView, type TreeNode } from "./lineage/lineageModel";
import { genealogy, lineup, specs } from "./data";
import { Header } from "./components/Header";
import { GenealogySection, nodeKey } from "./components/GenealogySection";
import { CompareSection } from "./components/CompareSection";
import { DetailPanel } from "./components/DetailPanel";

export default function App() {
  const view = buildLineageView(genealogy, lineup, specs);
  // 選択中ノードのキー（label::year）。null なら詳細パネルは閉じている。
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedNode =
    view.groups.flatMap((g) => g.nodes).find((n) => nodeKey(n) === selectedKey) ?? null;

  // 同じノードを再クリックしたら閉じる（トグル）。
  const handleSelect = (node: TreeNode) =>
    setSelectedKey((prev) => (prev === nodeKey(node) ? null : nodeKey(node)));

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-0 pb-24">
      <Header />
      <GenealogySection view={view} selectedKey={selectedKey} onSelect={handleSelect} />
      <CompareSection view={view} />
      <DetailPanel node={selectedNode} view={view} onClose={() => setSelectedKey(null)} />
    </div>
  );
}
