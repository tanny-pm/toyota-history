import { buildLineageView } from './lineage/lineageModel'
import { Header } from './components/Header'
import { GenealogySection } from './components/GenealogySection'
import { CompareSection } from './components/CompareSection'

export default function App() {
  const view = buildLineageView()
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 96px' }}>
      <Header />
      <GenealogySection view={view} />
      <CompareSection view={view} />
    </div>
  )
}
