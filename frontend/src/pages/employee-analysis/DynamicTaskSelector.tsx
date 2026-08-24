import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-extra";
import { Loader2 } from "lucide-react";

export function DynamicTaskSelector({ 
  employee, 
  products, 
  onTaskAssigned,
  activeTasksCount 
}: { 
  employee: any, 
  products: any[], 
  onTaskAssigned: () => void,
  activeTasksCount: number
}) {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigning, setAssigning] = useState(false);

  if (activeTasksCount >= 3) {
    return (
      <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 text-sm font-medium text-center">
        Task limit reached. This employee already has 3 active tasks.
      </div>
    );
  }

  const dept = employee?.departmentName || "";
  const subDept = employee?.subDepartmentName || "";

  let availableTasks: any[] = [];
  let requiresQuantity = false;
  let quantityStep = 1;

  if (dept.includes("Production")) {
    if (subDept.includes("Labour")) {
      availableTasks = [
        { title: "Loading Materials", desc: "Receive raw materials and move them from vehicles or storage to the production area safely." },
        { title: "Unloading Materials", desc: "Unload raw materials, components, packaging materials or finished goods without causing damage." },
        { title: "Material Handling", desc: "Move raw materials and semi-finished products between production stages as required." },
        { title: "Assist Machine Operators", desc: "Supply materials to machine operators, collect processed products and provide operational support." },
        { title: "Raw Material Handling", desc: "Arrange, identify and supply required raw materials according to production requirements." },
        { title: "Production Support", desc: "Assist production workers and operators to maintain a continuous workflow." },
        { title: "Product Movement", desc: "Transfer finished or semi-finished products to inspection, packaging, storage or dispatch areas." },
        { title: "Workplace Cleanliness", desc: "Keep production and material-handling areas clean, organized and free from unnecessary obstructions." },
        { title: "Safety Procedures", desc: "Follow PPE and safety instructions and immediately report unsafe conditions." },
        { title: "Waste Handling", desc: "Separate and move production waste, rejected material and scrap to designated areas." }
      ];
    } else if (subDept.includes("Packaging")) {
      availableTasks = [
        { title: "Receive Finished Products", desc: "Collect completed products from production after required checking or quality clearance." },
        { title: "Product Checking", desc: "Check quantity and identify visible damage, defects or incorrect items before packing." },
        { title: "Packing", desc: "Place products into the correct boxes, bags, containers or other approved packaging." },
        { title: "Quantity Checking", desc: "Ensure the correct number of products is packed in each package." },
        { title: "Labeling", desc: "Apply correct product labels, batch numbers, dates, barcodes and other required information." },
        { title: "Sealing", desc: "Seal boxes, bags, cartons or containers securely to prevent damage or loss." },
        { title: "Box Arrangement", desc: "Arrange products properly inside boxes to reduce movement and damage during transportation." },
        { title: "Package Identification", desc: "Mark packages with product name, quantity, batch number, destination or other required details." },
        { title: "Storage Preparation", desc: "Arrange packed products for safe and efficient transfer to the warehouse." },
        { title: "Dispatch Preparation", desc: "Organize packed goods according to customer orders or dispatch requirements." },
        { title: "Packaging Material Management", desc: "Monitor availability of boxes, labels, tape, bags and other." }
      ];
    } else if (subDept.includes("Machine")) {
      availableTasks = [
        { title: "Machine Operation", desc: "Operate production machines according to approved operating procedures and production requirements." },
        { title: "Machine Setup", desc: "Prepare machines before production, including fitting required tools, dies, components or materials." },
        { title: "Parameter Setting", desc: "Set approved machine parameters such as speed, temperature, pressure and time according to product requirements." },
        { title: "Production Monitoring", desc: "Monitor machine operation and output continuously to identify abnormalities." }, // NEEDS QUANTITY
        { title: "Quality Monitoring", desc: "Check output for visible or process-related issues and report deviations promptly." },
        { title: "Machine Maintenance", desc: "Perform routine cleaning, lubrication, inspection and other authorized preventive maintenance." },
        { title: "Problem Identification", desc: "Identify unusual noise, vibration, overheating, incorrect output or other machine abnormalities." },
        { title: "Breakdown Reporting", desc: "Report major breakdowns or technical issues promptly to the supervisor or maintenance team." },
        { title: "Machine Adjustment", desc: "Make authorized adjustments to machine settings when required to maintain stable production." },
        { title: "Production Records", desc: "Record production quantity, machine downtime, operating hours and machine-related issues." },
        { title: "Safety Compliance", desc: "Follow machine safety procedures and use required PPE while operating equipment." },
        { title: "Machine Shutdown", desc: "Stop and isolate machines safely after production or during emergencies according to procedures." }
      ];
    }
  } else if (dept.includes("Marketing")) {
    if (subDept === "SO" || subDept === "SSO") {
      availableTasks = products.map(p => ({
        title: p.name,
        desc: `SKU: ${p.sku} | Price: $${p.price} | Stock: ${p.stock}`
      }));
      requiresQuantity = true;
      if (subDept === "SSO") quantityStep = 100;
    } else if (subDept === "TSO") {
      availableTasks = [
        { title: "CORE PRODUCT", desc: "Consignment Task: Core Product distribution." },
        { title: "NEW LAUNCH", desc: "Consignment Task: New Launch promotion." },
        { title: "BUFFER STOCK", desc: "Consignment Task: Buffer Stock management." }
      ];
    } else if (subDept === "ISR") {
      availableTasks = [
        { title: "WEEKLY REPORT", desc: "Meeting: Submit weekly sales and lead generation report." },
        { title: "CAMPAIGN REVIEW", desc: "Meeting: Review ongoing campaign performance." },
        { title: "STRATEGY", desc: "Meeting: Quarterly strategy alignment session." },
        { title: "TRAINING MEETING", desc: "Meeting: Product and sales training session." }
      ];
    }
  }

  // Fallback for empty
  if (availableTasks.length === 0) {
    availableTasks = [
      { title: "General Task", desc: "Standard assigned work." }
    ];
  }

  // Specific check for Machine operator production monitoring
  if (selectedTask?.title === "Production Monitoring") {
    requiresQuantity = true;
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) {
      toast({ variant: "destructive", title: "Error", description: "Please select a task first." });
      return;
    }
    if (requiresQuantity && !quantity) {
      toast({ variant: "destructive", title: "Error", description: "Quantity is required for this task." });
      return;
    }

    setAssigning(true);
    try {
      await api.assignTask({
        employeeId: employee.id || employee._id,
        title: selectedTask.title,
        description: selectedTask.desc,
        dueDate: dueDate,
        priority: "medium",
        quantity: quantity ? Number(quantity) : undefined,
        status: "pending"
      });
      toast({ title: "Task Assigned", description: "The task was successfully assigned." });
      setSelectedTask(null);
      setQuantity("");
      setDueDate("");
      onTaskAssigned();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Assignment Failed", description: err.message });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-2 pt-4 snap-x custom-scrollbar" style={{ transform: 'rotateX(180deg)' }}>
        {availableTasks.map((task, idx) => (
          <div 
            key={idx}
            style={{ transform: 'rotateX(180deg)' }}
            onClick={() => { 
              if (selectedTask?.title === task.title) {
                setSelectedTask(null);
              } else {
                setSelectedTask(task); 
                setQuantity(""); 
              }
            }}
            className={`min-w-[280px] max-w-[280px] p-4 rounded-2xl border-2 cursor-pointer transition-all snap-start flex flex-col
              ${selectedTask?.title === task.title ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200'}`}
          >
            <h4 className={`font-bold text-base mb-1 line-clamp-1 ${selectedTask?.title === task.title ? 'text-primary' : 'text-slate-800'}`}>{task.title}</h4>
            <p className="text-xs text-slate-500 line-clamp-3 mt-auto">{task.desc}</p>
          </div>
        ))}
      </div>

      {selectedTask && (
        <form onSubmit={handleAssign} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Selected Task: <span className="text-primary">{selectedTask.title}</span></h4>
            <p className="text-sm text-slate-500 mt-1">{selectedTask.desc}</p>
          </div>
          
          <div className="flex gap-4">
            {requiresQuantity && (
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Quantity</label>
                <Input 
                  type="number" 
                  min={quantityStep} 
                  step={quantityStep}
                  required 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  placeholder={`Quantity (Multiples of ${quantityStep})`}
                  className="bg-white"
                />
              </div>
            )}
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 mb-1 block">Due Date</label>
              <Input 
                type="date" 
                required 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                className="bg-white"
              />
            </div>
          </div>
          
          <Button type="submit" disabled={assigning} className="w-full h-12 rounded-xl font-bold">
            {assigning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Assigning...</> : "Assign Task"}
          </Button>
        </form>
      )}
    </div>
  );
}
