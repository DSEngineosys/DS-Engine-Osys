import { PublicLayout } from "@/components/layout";

export default function About() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl font-bold mb-8">About DS Engineosys</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-xl text-muted-foreground mb-8">
            We build precision tools for data scientists who demand rigorous, actionable intelligence.
          </p>

          <div className="grid md:grid-cols-2 gap-12 my-12">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p className="text-muted-foreground">
                To transform raw organizational data into structured, predictive insights. We believe that business intelligence shouldn't just report on the past—it should prescribe the future.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">The Architecture</h2>
              <p className="text-muted-foreground">
                Inspired by the operational structures of massive tech conglomerates, DS Engineosys divides its focus into two core phases: Employee Analysis and Product Analysis. This separation of concerns allows for deep, specialized tooling.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 border mt-12">
            <h2 className="text-2xl font-semibold mb-6">Designed for DS Engineers</h2>
            <p className="mb-4">
              Unlike generic dashboards built for middle management, this platform is built specifically for Data Science Engineers.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Dense data density without visual clutter</li>
              <li>• Direct exposure of ML confidence scores and metrics</li>
              <li>• Clear delineation between human records and algorithmic predictions</li>
            </ul>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
