import { useState, useEffect } from "react";
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

  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  let requiresQuantity = false;
  let quantityStep = 1;

  useEffect(() => {
    async function loadTasks() {
      if (!dept || !subDept) return;
      
      if (dept.includes("Marketing") && (subDept === "SO" || subDept === "SSO")) {
        // Use products for SO and SSO
        setAvailableTasks(products.map(p => ({
          title: p.name,
          desc: `SKU: ${p.sku} | Price: $${p.price} | Stock: ${p.stock}`,
          requiresQuantity: true
        })));
      } else {
        // Fetch predefined DS Tasks from backend for everything else
        setLoadingTasks(true);
        try {
          const dsTasks = await api.getDSTasks(dept, subDept);
          if (dsTasks.length > 0) {
            setAvailableTasks(dsTasks.map(t => ({
              title: t.title,
              desc: t.description,
              requiresQuantity: t.requiresQuantity
            })));
          } else {
            setAvailableTasks([{ title: "General Task", desc: "Standard assigned work." }]);
          }
        } catch (e) {
          console.error("Failed to load DS Tasks", e);
          setAvailableTasks([{ title: "General Task", desc: "Standard assigned work." }]);
        } finally {
          setLoadingTasks(false);
        }
      }
    }
    loadTasks();
  }, [dept, subDept, products]);

  // Specific check for Machine operator production monitoring or SO/SSO
  if (selectedTask?.requiresQuantity || (dept.includes("Marketing") && (subDept === "SO" || subDept === "SSO"))) {
    requiresQuantity = true;
  }
  if (subDept === "SSO") {
    quantityStep = 100;
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
      {loadingTasks ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
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
      )}

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
