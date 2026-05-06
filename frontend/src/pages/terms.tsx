import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PublicLayout } from "@/components/layout";

export default function Terms() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
        
        <div className="bg-white border rounded-lg p-1 shadow-sm mb-8">
          <ScrollArea className="h-[50vh] p-6 text-sm text-muted-foreground leading-relaxed">
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p className="mb-4">By accessing or using DS Engineosys, you agree to be bound by these terms.</p>
            
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Data Privacy</h2>
            <p className="mb-4">We respect your data privacy. All data analyzed through this platform remains the property of your organization. We do not share your business intelligence with third parties.</p>
            
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Acceptable Use</h2>
            <p className="mb-4">This platform is intended for professional business intelligence and data science applications. Any misuse, unauthorized scraping, or reverse engineering is strictly prohibited.</p>
            
            <h2 className="text-lg font-semibold text-foreground mb-2">4. ML Predictions Disclaimer</h2>
            <p className="mb-4">The machine learning predictions and recommendations provided by the platform (including product rankings and demand forecasts) are algorithmic estimates. They should be used as aids to human decision-making, not as guarantees.</p>
            
            {/* Add more filler terms to make it scrollable */}
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Service Availability</h2>
            <p className="mb-4">While we strive for 99.9% uptime, we do not guarantee uninterrupted access to the service. Maintenance windows will be scheduled during off-peak hours.</p>

            <h2 className="text-lg font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
            <p className="mb-4">DS Engineosys shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues.</p>
          </ScrollArea>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
          <Link href="/">
            <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="button-decline-terms">
              Decline
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button size="lg" className="w-full sm:w-auto" data-testid="button-accept-terms">
              Accept & Continue
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
