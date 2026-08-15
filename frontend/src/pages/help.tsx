import { useState } from "react";
import { PublicLayout } from "@/components/layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, HelpCircle } from "lucide-react";

const ISSUE_TYPES = [
  "Forgot Password",
  "App / Server Error",
  "Task Not Assigned",
  "Salary Issue",
  "Leave Request",
  "Other",
];

export default function Help() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    subDepartment: "",
    phoneNumber: "",
    issueType: "",
    description: "",
  });

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.issueType) {
      toast({ variant: "destructive", title: "Error", description: "Please select an issue type." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/help-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit request");
      }
      toast({ title: "✅ Help request submitted!", description: "HR has been notified and will contact you soon." });
      setForm({ employeeId: "", employeeName: "", department: "", subDepartment: "", phoneNumber: "", issueType: "", description: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Submission failed", description: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const faqs = [
    { q: "What is the Employee Analysis Phase?", a: "This phase allows you to monitor department performance, track individual employee efficiency, and manage tasks. It provides scoring based on task completion and historical performance." },
    { q: "How does the Product Analysis Phase work?", a: "The Product Analysis Phase utilizes machine learning models to predict market demand, rank products by viability, and suggest optimal discount offers for low-demand inventory." },
    { q: "How are performance scores calculated?", a: "Scores are calculated using a weighted algorithm that considers task completion rates, deadline adherence, and historical efficiency metrics across specified periods." },
    { q: "How do I reset my password?", a: "If you are an Employee, please use the Help form below to contact HR. If you are a DS Engineer, use the Forgot Password option on the login page." },
    { q: "How often is the data updated?", a: "The dashboard and analytics views reflect real-time data as tasks are completed and product sales are recorded in the system." },
  ];

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-20 space-y-16">
        {/* FAQ Section */}
        <div>
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3">Help & FAQ</h1>
            <p className="text-muted-foreground">Find answers to common questions about DS Engineosys.</p>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-medium text-base hover:text-primary">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Employee Help Request Form */}
        <div>
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Employee Help Request</h2>
            <p className="text-muted-foreground">
              Having trouble? Fill out this form and HR will be notified immediately via email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border shadow-sm p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Employee ID *</label>
                <Input placeholder="e.g. EMP001" value={form.employeeId} onChange={e => setField("employeeId", e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Full Name *</label>
                <Input placeholder="Your full name" value={form.employeeName} onChange={e => setField("employeeName", e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Department *</label>
                <Input placeholder="e.g. Sales, Production" value={form.department} onChange={e => setField("department", e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Sub-Department</label>
                <Input placeholder="e.g. Marketing, QA" value={form.subDepartment} onChange={e => setField("subDepartment", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Phone Number *</label>
                <Input placeholder="Your contact number" value={form.phoneNumber} onChange={e => setField("phoneNumber", e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Issue Type *</label>
                <select
                  value={form.issueType}
                  onChange={e => setField("issueType", e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select issue type...</option>
                  {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Description of Problem *</label>
              <textarea
                value={form.description}
                onChange={e => setField("description", e.target.value)}
                required
                placeholder="Describe your issue in detail..."
                rows={5}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-bold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Help Request
            </Button>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}
