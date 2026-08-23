import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Camera, Send, Target } from "lucide-react";
import { api } from "@/lib/api-extra";

export function RoleBasedWorkspace({ profile, tasks, products, openCamera, proofImageUrl, setProofImageUrl }: any) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const dept = profile?.departmentName?.toLowerCase() || "";
  const subDept = profile?.subDepartment?.toLowerCase() || "";

  const handleSubmit = async (e: React.FormEvent, activityType: string) => {
    e.preventDefault();
    
    // Check if proof image is required for this role
    const requiresProof = ["labour team", "packaging team", "machine operator", "so", "tso"].includes(subDept);
    
    if (requiresProof && !proofImageUrl) {
      toast({ variant: "destructive", title: "Proof Required", description: "Please capture a picture for proof." });
      return;
    }

    setLoading(true);
    try {
      await api.submitEmployeeActivity({
        activityType,
        payload: { ...formData, proofImageUrl, taskId: tasks?.[0]?._id }
      });
      toast({ title: "Activity Submitted Successfully" });
      setFormData({});
      setProofImageUrl("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to submit activity" });
    } finally {
      setLoading(false);
    }
  };

  const CameraCaptureBtn = () => (
    <div 
      className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors" 
      onClick={() => { if (!proofImageUrl) openCamera(); }}
    >
      {proofImageUrl ? (
        <div className="space-y-2">
          <div className="text-green-600 font-bold flex items-center justify-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"/> Proof Captured</div>
          <img src={proofImageUrl} alt="Proof" className="w-full max-h-32 object-contain rounded" />
          <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setProofImageUrl(""); }}>Retake</Button>
        </div>
      ) : (
        <div className="text-slate-500 flex flex-col items-center gap-1">
          <Camera className="w-6 h-6 mb-1"/>
          <span className="text-sm font-semibold">Tap to Open Camera & Capture Proof</span>
        </div>
      )}
    </div>
  );

  // Production Department Workspaces
  if (dept.includes("production")) {
    if (subDept === "labour team") {
      return (
        <form onSubmit={e => handleSubmit(e, "Labour Task")} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block">Product Details</label>
            <Input placeholder="What product are you preparing?" value={formData.productDetails || ""} onChange={e => setFormData({...formData, productDetails: e.target.value})} required />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Materials Used</label>
            <Input placeholder="List materials used" value={formData.materialsUsed || ""} onChange={e => setFormData({...formData, materialsUsed: e.target.value})} required />
          </div>
          <CameraCaptureBtn />
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Submit Activity</Button>
        </form>
      );
    }
    if (subDept === "packaging team") {
      return (
        <form onSubmit={e => handleSubmit(e, "Packaging Task")} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block">Manufactured Product Details</label>
            <Input placeholder="Product name/batch" value={formData.productDetails || ""} onChange={e => setFormData({...formData, productDetails: e.target.value})} required />
          </div>
          <CameraCaptureBtn />
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Submit Activity</Button>
        </form>
      );
    }
    if (subDept === "machine operator") {
      return (
        <form onSubmit={e => handleSubmit(e, "Machine Operation")} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block">Machine Details</label>
            <Input placeholder="Machine Name / ID / Status" value={formData.machineDetails || ""} onChange={e => setFormData({...formData, machineDetails: e.target.value})} required />
          </div>
          <CameraCaptureBtn />
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Submit Activity</Button>
        </form>
      );
    }
  }

  // Marketing Department Workspaces
  if (dept.includes("marketing")) {
    if (subDept === "isr") {
      return (
        <form onSubmit={e => handleSubmit(e, "ISR Meeting & Tasks")} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block">Schedule Meeting with SSO</label>
            <Input placeholder="Meeting details / agenda" value={formData.meetingDetails || ""} onChange={e => setFormData({...formData, meetingDetails: e.target.value})} required />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Task Scheduled by DS Engineer</label>
            <textarea className="w-full border rounded p-2 text-sm" rows={3} value={tasks?.[0]?.description || "No active tasks."} readOnly />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Submit Update</Button>
        </form>
      );
    }
    if (subDept === "sso") {
      return (
        <form onSubmit={e => handleSubmit(e, "SSO District Sales")} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block">District Name</label>
            <Input placeholder="Enter district" value={formData.district || ""} onChange={e => setFormData({...formData, district: e.target.value})} required />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Consignment Details</label>
            <textarea className="w-full border rounded p-2 text-sm" rows={3} value={formData.consignmentDetails || ""} onChange={e => setFormData({...formData, consignmentDetails: e.target.value})} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Submit Sale</Button>
        </form>
      );
    }
    if (subDept === "so") {
      return (
        <form onSubmit={e => handleSubmit(e, "SO Area Sales")} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block">Assigned Work / Area</label>
            <Input placeholder="Geographical location" value={formData.area || ""} onChange={e => setFormData({...formData, area: e.target.value})} required />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Quantity to Sale</label>
            <Input type="number" placeholder="Quantity" value={formData.quantity || ""} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} required />
          </div>
          <div className="border rounded-lg p-3 space-y-3 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-500 uppercase">Customer Details</p>
            <Input placeholder="Customer name" value={formData.customerName || ""} onChange={e => setFormData({...formData, customerName: e.target.value})} required />
            <Input placeholder="Customer phone" value={formData.customerPhone || ""} onChange={e => setFormData({...formData, customerPhone: e.target.value})} required />
          </div>
          <CameraCaptureBtn />
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Submit Sale</Button>
        </form>
      );
    }
    if (subDept === "tso") {
      return (
        <form onSubmit={e => handleSubmit(e, "TSO State Sales")} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block">State Name</label>
            <Input placeholder="Enter state" value={formData.state || ""} onChange={e => setFormData({...formData, state: e.target.value})} required />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Product Consignment Details</label>
            <textarea className="w-full border rounded p-2 text-sm" rows={2} value={formData.consignmentDetails || ""} onChange={e => setFormData({...formData, consignmentDetails: e.target.value})} required />
          </div>
          <div className="border rounded-lg p-3 space-y-3 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-500 uppercase">Customer Details</p>
            <Input placeholder="Customer name" value={formData.customerName || ""} onChange={e => setFormData({...formData, customerName: e.target.value})} required />
            <Input placeholder="Customer contact" value={formData.customerContact || ""} onChange={e => setFormData({...formData, customerContact: e.target.value})} required />
          </div>
          <CameraCaptureBtn />
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Submit Consignment Sale</Button>
        </form>
      );
    }
  }

  // Fallback for HR or other sub-departments
  return (
    <div className="text-center py-6">
      <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
      <p className="font-bold text-slate-600">No specific workspace configured</p>
      <p className="text-xs text-slate-400 mt-1">Your role does not have a custom data entry form yet.</p>
    </div>
  );
}
