import { PublicLayout } from "@/components/layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Help() {
  const faqs = [
    {
      q: "What is the Employee Analysis Phase?",
      a: "This phase allows you to monitor department performance, track individual employee efficiency, and manage tasks. It provides scoring based on task completion and historical performance."
    },
    {
      q: "How does the Product Analysis Phase work?",
      a: "The Product Analysis Phase utilizes machine learning models to predict market demand, rank products by viability, and suggest optimal discount offers for low-demand inventory."
    },
    {
      q: "How are performance scores calculated?",
      a: "Scores are calculated using a weighted algorithm that considers task completion rates, deadline adherence, and historical efficiency metrics across specified periods."
    },
    {
      q: "Can I export the ML predictions?",
      a: "Currently, predictions are viewed within the platform's command center. Export functionality is planned for the next major release."
    },
    {
      q: "How often is the data updated?",
      a: "The dashboard and analytics views reflect real-time data as tasks are completed and product sales are recorded in the system."
    }
  ];

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help & FAQ</h1>
          <p className="text-muted-foreground text-lg">
            Find answers to common questions about using DS Engineosys.
          </p>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-2 md:p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-medium text-base hover:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </PublicLayout>
  );
}
