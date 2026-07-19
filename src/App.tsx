import { buildLineageView } from "./lineage/lineageModel";
import { Header } from "./components/Header";
import { GenealogySection } from "./components/GenealogySection";
import { CompareSection } from "./components/CompareSection";

export default function App() {
  const view = buildLineageView();
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-0 pb-24">
      <Header />
      <GenealogySection view={view} />
      <CompareSection view={view} />
    </div>
  );
}
