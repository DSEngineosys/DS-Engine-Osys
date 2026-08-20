import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

const ISSUE_TYPES = [
  "App / Server Error",
  "Task Not Assigned",
  "Salary Issue",
  "Leave Request",
  "Other",
];

export function EmployeeHelpModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({
    employeeId: "",
    employeeName: "",
    email: "",
    department: "",
    subDepartment: "",
    phoneNumber: "+91 ",
    issueType: "",
    description: "",
  });

  useEffect(() => {
    if (open && departments.length === 0) {
      fetch("/api/departments")
        .then(res => res.json())
        .then(data => setDepartments(data))
        .catch(err => console.error("Failed to load departments:", err));
    }
  }, [open, departments.length]);

  function setField(key: string, value: string) {
    if (key === "phoneNumber" && !value.startsWith("+91 ")) {
      if (value.startsWith("+91")) value = value.replace("+91", "+91 ");
      else if (!value.startsWith("+")) value = "+91 " + value;
      else value = "+91 " + value.substring(value.indexOf(" ") + 1 || 3);
    }
    
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "department") {
        next.subDepartment = "";
      }
      return next;
    });
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
      setForm({ employeeId: "", employeeName: "", email: "", department: "", subDepartment: "", phoneNumber: "+91 ", issueType: "", description: "" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Submission failed", description: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Employee Help Request</DialogTitle>
          <DialogDescription>
            Having trouble? Fill out this form and HR will be notified immediately via email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Email (optional)</label>
              <Input type="email" placeholder="Your email address" value={form.email} onChange={e => setField("email", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Department *</label>
              <select
                value={form.department}
                onChange={e => setField("department", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select Department...</option>
                {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Sub-Department</label>
              <select
                value={form.subDepartment}
                onChange={e => setField("subDepartment", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={!form.department || !departments.find(d => d.name === form.department)?.subDepartments?.length}
              >
                <option value="">Select Sub-Department...</option>
                {departments.find(d => d.name === form.department)?.subDepartments?.map((sd: string) => (
                  <option key={sd} value={sd}>{sd}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Phone Number *</label>
              <Input placeholder="+91 XXXXX XXXXX" value={form.phoneNumber} onChange={e => setField("phoneNumber", e.target.value)} required />
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
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-11 text-base font-bold">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Submit Help Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
