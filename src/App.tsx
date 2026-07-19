import { buildLineageView } from "./lineage/lineageModel";
import { genealogy, lineup, specs } from "./data";
import { Header } from "./components/Header";
import { GenealogySection } from "./components/GenealogySection";
import { CompareSection } from "./components/CompareSection";

export default function App() {
  const view = buildLineageView(genealogy, lineup, specs);
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-0 pb-24">
      <Header />
      <GenealogySection view={view} />
      <CompareSection view={view} />
    </div>
  );
}
