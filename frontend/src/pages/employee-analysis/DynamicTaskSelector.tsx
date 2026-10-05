import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-extra";
import { Loader2, Tag, Layers, Package } from "lucide-react";

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

  // Filters for Category & Subcategory
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");

  if (activeTasksCount >= 3) {
    return (
      <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 text-sm font-medium text-center">
        Task limit reached. This employee already has 3 active tasks.
      </div>
    );
  }

  const dept = employee?.departmentName || "";
  const subDept = employee?.subDepartmentName || "";
  const isMarketingSOorSSO = dept.includes("Marketing") && (subDept === "SO" || subDept === "SSO");

  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  let requiresQuantity = false;
  let quantityStep = 1;

  useEffect(() => {
    async function loadTasks() {
      if (!dept || !subDept) return;
      
      if (isMarketingSOorSSO) {
        // Filter out-of-stock products and map with category & subcategory info
        setAvailableTasks(
          products
            .filter(p => (p.stock ?? p.stockQuantity ?? 0) > 0)
            .map(p => {
              const stockVal = p.stock ?? p.stockQuantity ?? 0;
              const isOffer = p.isOfferActive && p.offerPercentage > 0;
              const discount = p.offerPercentage || p.discountPercent || 0;
              const priceVal = p.price ?? p.sellingPrice ?? 0;
              const discountedPrice = isOffer ? (priceVal * (1 - discount / 100)).toFixed(2) : null;

              return {
                title: p.name || p.productName,
                desc: isOffer 
                  ? `SKU: ${p.sku || p.productId} | Stock: ${stockVal} units | Price: ₹${discountedPrice} (Original: ₹${priceVal}, -${discount}% OFF)`
                  : `SKU: ${p.sku || p.productId} | Stock: ${stockVal} units | Price: ₹${priceVal}`,
                requiresQuantity: true,
                isOfferActive: isOffer,
                offerPercentage: discount,
                offerName: p.activeOfferDetails?.offerName,
                originalPrice: priceVal,
                discountedPrice: discountedPrice,
                category: p.category || "General",
                subCategory: p.subCategory || "General",
                stock: stockVal
              };
            })
        );
      } else {
        // Fetch predefined DS Tasks from backend for non-marketing roles
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
  }, [dept, subDept, products, isMarketingSOorSSO]);

  if (selectedTask?.requiresQuantity || isMarketingSOorSSO) {
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

  // Derive unique categories & subcategories for filtering
  const categories = Array.from(new Set(availableTasks.map(t => t.category).filter(Boolean)));
  const subCategories = Array.from(
    new Set(
      availableTasks
        .filter(t => categoryFilter === "all" || t.category?.toLowerCase() === categoryFilter.toLowerCase())
        .map(t => t.subCategory)
        .filter(Boolean)
    )
  );

  // Filter tasks based on selected dropdown values
  const filteredTasks = availableTasks.filter(t => {
    if (categoryFilter !== "all" && t.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (subCategoryFilter !== "all" && t.subCategory?.toLowerCase() !== subCategoryFilter.toLowerCase()) return false;
    return true;
  });

  // Group filtered tasks by Category -> SubCategory
  const groupedTasks = filteredTasks.reduce((acc: any, t: any) => {
    const cat = t.category || "General";
    const sub = t.subCategory || "General";
    if (!acc[cat]) acc[cat] = {};
    if (!acc[cat][sub]) acc[cat][sub] = [];
    acc[cat][sub].push(t);
    return acc;
  }, {});

  const renderTaskCard = (task: any, idx: number) => {
    const isOffer = task.isOfferActive;
    const isSelected = selectedTask?.title === task.title;
    const hasStock = task.stock !== undefined && task.stock !== null;

    return (
      <div 
        key={idx}
        onClick={() => { 
          if (isSelected) {
            setSelectedTask(null);
          } else {
            setSelectedTask(task); 
            setQuantity(""); 
          }
        }}
        className={`min-w-[280px] max-w-[280px] shrink-0 p-4 rounded-2xl border-2 cursor-pointer transition-all snap-start flex flex-col relative
          ${isSelected 
            ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
            : isOffer
            ? 'border-sky-400 bg-sky-50/40 hover:border-sky-500 ring-1 ring-sky-300 shadow-sm shadow-sky-100'
            : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}
      >
        {isOffer && (
          <span className="absolute top-3 right-3 bg-sky-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
            -{task.offerPercentage}% OFF
          </span>
        )}
        <h4 className={`font-bold text-base mb-1 line-clamp-1 ${isSelected ? 'text-primary' : 'text-slate-800'} ${isOffer ? 'pr-14' : ''}`}>
          {task.title}
        </h4>
        <p className="text-xs text-slate-500 line-clamp-2 mt-auto">{task.desc}</p>
        
        {hasStock && (
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              {task.stock} units
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {loadingTasks ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isMarketingSOorSSO ? (
        <div className="space-y-6">
          {/* Category & SubCategory Filter Header */}
          <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <Tag className="w-4 h-4 text-primary" /> Category & Subcategory Filter:
            </div>
            <div className="flex gap-3 flex-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={e => {
                    setCategoryFilter(e.target.value);
                    setSubCategoryFilter("all");
                  }}
                  className="h-9 text-xs border border-slate-200 rounded-lg px-3 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((cat: any) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Sub Category:</span>
                <select
                  value={subCategoryFilter}
                  onChange={e => setSubCategoryFilter(e.target.value)}
                  className="h-9 text-xs border border-slate-200 rounded-lg px-3 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Subcategories ({subCategories.length})</option>
                  {subCategories.map((sub: any) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grouped Product Cards by Category -> SubCategory */}
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No available products with stock in selected category/subcategory.
            </div>
          ) : (
            Object.entries(groupedTasks).map(([category, subCats]: [string, any]) => (
              <div key={category} className="space-y-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/40">
                {/* Category Header */}
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    {category}
                  </h3>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                    Category
                  </span>
                </div>

                {/* Subcategories */}
                {Object.entries(subCats).map(([subCategory, items]: [string, any]) => (
                  <div key={subCategory} className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                      <span className="w-2 h-2 rounded-full bg-primary"></span> 
                      {subCategory} ({items.length})
                    </h4>

                    {/* Scrollable list of product cards */}
                    <div className="flex gap-4 overflow-x-auto pb-2 pt-1 snap-x custom-scrollbar">
                      {items.map((task: any, idx: number) => renderTaskCard(task, idx))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Default layout for non-marketing departments */
        <div className="flex gap-4 overflow-x-auto pb-2 pt-4 snap-x custom-scrollbar" style={{ transform: 'rotateX(180deg)' }}>
          {availableTasks.map((task, idx) => (
            <div key={idx} style={{ transform: 'rotateX(180deg)' }}>
              {renderTaskCard(task, idx)}
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <form onSubmit={handleAssign} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">
              Selected Task: <span className="text-primary">{selectedTask.title}</span>
            </h4>
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
