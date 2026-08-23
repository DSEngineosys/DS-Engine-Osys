import { HRLayout } from "@/components/layout";
import { ProfileCard } from "@/components/profile-card";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Package, HelpCircle, Mail, Settings, RefreshCcw, MessageSquare, Star, IndianRupee } from "lucide-react";

const PRODUCT_CATEGORIES: Record<string, string[]> = {
  "Skincare": ["Face Wash", "Moisturizer", "Serum", "Sunscreen", "Face Cream", "Toner", "Face Mask"],
  "Haircare": ["Shampoo", "Conditioner", "Hair Oil", "Hair Serum", "Hair Mask", "Hair Color"],
  "Makeup": ["Foundation", "Concealer", "Compact Powder", "Lipstick", "Lip Gloss", "Mascara", "Eyeliner", "Blush"],
  "Fragrance": ["Perfume", "Eau de Parfum", "Eau de Toilette", "Body Mist", "Deodorant"],
  "Body Care": ["Body Lotion", "Body Wash", "Body Scrub", "Hand Cream", "Body Butter"],
  "Bath & Hygiene": ["Soap", "Shower Gel", "Bath Salts", "Hand Wash"],
  "Sun Care": ["Sunscreen Lotion", "Sunscreen Gel", "After-Sun Lotion", "Sun Protection Spray"],
  "Men's Grooming": ["Beard Oil", "Shaving Cream", "Aftershave", "Face Wash", "Men's Moisturizer"],
  "Lip Care": ["Lip Balm", "Lip Scrub", "Lip Mask", "Tinted Lip Balm"],
  "Beauty & Personal Care": ["Facial Kits"],
  "Beauty Tools": ["Cosmetic Accessories", "Makeup Remover"]
};

const PRODUCT_TYPES = ["Cream", "Lotion", "Gel", "Serum", "Oil", "Powder", "Liquid", "Spray", "Mist", "Balm", "Stick", "Mask", "Scrub", "Wash", "Shampoo", "Conditioner", "Soap/Bar", "Perfume", "Eau de Parfum", "Eau de Toilette", "Pencil", "Sheet Mask"];

const INGREDIENTS_LIST = ["Aqua (Water)", "Glycerin", "Aloe Vera", "Hyaluronic Acid", "Niacinamide", "Salicylic Acid", "Glycolic Acid", "Lactic Acid", "Ascorbic Acid (Vitamin C)", "Vitamin E", "Retinol", "Ceramides", "Squalane", "Shea Butter", "Cocoa Butter", "Coconut Oil", "Jojoba Oil", "Argan Oil", "Castor Oil", "Rosehip Oil", "Tea Tree Oil", "Green Tea Extract", "Chamomile Extract", "Cucumber Extract", "Turmeric Extract", "Licorice Extract", "Rosemary Extract", "Centella Asiatica", "Zinc Oxide", "Titanium Dioxide", "Kaolin", "Bentonite", "Charcoal", "Beeswax", "Cetearyl Alcohol", "Cetyl Alcohol", "Stearic Acid", "Dimethicone", "Carbomer", "Xanthan Gum", "Tocopherol", "Panthenol", "Biotin", "Keratin", "Hydrolyzed Protein", "Sodium Hyaluronate", "Sodium Benzoate", "Potassium Sorbate", "Phenoxyethanol", "Citric Acid", "Fragrance", "Parfum", "Menthol", "Peppermint Extract", "Lavender Extract", "Rose Extract", "Vanilla Extract"];

export default function HRDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // State for data
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeRequests, setEmployeeRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [emailSettings, setEmailSettings] = useState({ hrEmail: "", hrAppPassword: "" });
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerFeedbacks, setCustomerFeedbacks] = useState<any[]>([]);

  // Forms state
  const [activeReqId, setActiveReqId] = useState("");
  const [allowForm, setAllowForm] = useState({ employeeId: "", shift: "", monthlySalary: 0 });
  const [prodForm, setProdForm] = useState<{
    productId: string; name: string; category: string; subCategory: string; type: string; description: string; ingredients: string[]; ageGroup: string; gender: string; manufactureDate: string; expiryDate: string; batchNumber: string; mrp: number; discountPercent: number; taxPercent: number; price: number; stock: number;
  }>({
    productId: "", name: "", category: "", subCategory: "", type: "", description: "", ingredients: [], ageGroup: "", gender: "Other", manufactureDate: "", expiryDate: "", batchNumber: "", mrp: 0, discountPercent: 0, taxPercent: 0, price: 0, stock: 0
  });

  const fetchData = async () => {
    try {
      const [empRes, reqRes, prodRes, helpRes, settingsRes, deptRes, feedbackRes] = await Promise.all([
        fetch("/api/hr/employees"), fetch("/api/hr/employee-requests"), fetch("/api/hr/products"), fetch("/api/hr/help-requests"), fetch("/api/hr/settings/email"), fetch("/api/departments"), fetch("/api/hr/customer-feedback")
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (reqRes.ok) setEmployeeRequests(await reqRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (helpRes.ok) setHelpRequests(await helpRes.json());
      if (settingsRes.ok) setEmailSettings(await settingsRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (feedbackRes.ok) setCustomerFeedbacks(await feedbackRes.json());
    } catch (e) {
      console.error("Failed to fetch HR data", e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAllowReq = async (id: string) => {
    if (!allowForm.shift || !allowForm.monthlySalary) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all assignment fields." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/employee-requests/${id}/allow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allowForm)
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast({ title: "Employee Approved", description: "Employee access granted successfully." });
      setAllowForm({ employeeId: "", shift: "", monthlySalary: 0 });
      setActiveReqId("");
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDenyReq = async (id: string) => {
    if (!confirm("Are you sure you want to deny this request?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/employee-requests/${id}/deny`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).message);
      toast({ title: "Request Denied" });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/hr/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prodForm) });
      if (!res.ok) throw new Error((await res.json()).message);
      toast({ title: "Product Added" });
      fetchData();
      setProdForm({
        productId: "", name: "", category: "", subCategory: "", type: "", description: "", ingredients: [], ageGroup: "", gender: "Other", manufactureDate: "", expiryDate: "", batchNumber: "", mrp: 0, discountPercent: 0, taxPercent: 0, price: 0, stock: 0
      });
    } catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.message }); }
    finally { setLoading(false); }
  };

  const updateEmpStatus = async (id: string, accountStatus: string) => {
    await fetch(`/api/hr/employees/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountStatus }) });
    fetchData();
  };

  const deleteEmployee = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/hr/employees/${id}`, { method: "DELETE" });
    fetchData();
  };



  const updateProdStatus = async (id: string, status: string) => {
    await fetch(`/api/hr/products/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchData();
  };

  const updateHelpStatus = async (id: string, status: string) => {
    await fetch(`/api/hr/help-requests/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchData();
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/hr/settings/email", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(emailSettings) });
    toast({ title: "Settings Saved" });
    setLoading(false);
  };

  return (
    <HRLayout>
      <div className="space-y-6 pb-20">
        <ProfileCard />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-7 h-auto p-1 bg-slate-100">
            <TabsTrigger value="overview" className="py-3">Overview</TabsTrigger>
            <TabsTrigger value="recruitment" className="py-3">Employee Recruitment</TabsTrigger>
            <TabsTrigger value="employees" className="py-3">Employee List</TabsTrigger>
            <TabsTrigger value="add-product" className="py-3">Add Product</TabsTrigger>
            <TabsTrigger value="products" className="py-3">Product List</TabsTrigger>
            <TabsTrigger value="feedback" className="py-3">Customer Feedback</TabsTrigger>
            <TabsTrigger value="help" className="py-3">Help Inbox</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2 flex-row justify-between"><CardTitle>Total Employees</CardTitle><Users className="h-5 w-5 text-blue-500" /></CardHeader>
              <CardContent><div className="text-3xl font-bold">{employees.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex-row justify-between"><CardTitle>Active Products</CardTitle><Package className="h-5 w-5 text-purple-500" /></CardHeader>
              <CardContent><div className="text-3xl font-bold">{products.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex-row justify-between"><CardTitle>Pending Help</CardTitle><HelpCircle className="h-5 w-5 text-amber-500" /></CardHeader>
              <CardContent><div className="text-3xl font-bold">{helpRequests.filter(h => h.status === 'Pending').length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex-row justify-between"><CardTitle>Customer Feedback</CardTitle><MessageSquare className="h-5 w-5 text-teal-500" /></CardHeader>
              <CardContent><div className="text-3xl font-bold">{customerFeedbacks.length}</div></CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="recruitment">
            <Card>
              <CardHeader><CardTitle>Employee Recruitment Requests</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeeRequests.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No pending employee registration requests.</div>
                  ) : (
                    employeeRequests.map((req: any) => (
                      <div key={req._id} className="p-4 border rounded-xl bg-slate-50 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                          <div><strong className="text-sm">Name:</strong> {req.name}</div>
                          <div><strong className="text-sm">Email:</strong> {req.email}</div>
                          <div><strong className="text-sm">Phone:</strong> {req.contactNumber}</div>
                          <div><strong className="text-sm">Department:</strong> {req.departmentName} {req.subDepartment ? `(${req.subDepartment})` : ''}</div>
                          <div><strong className="text-sm">Gender:</strong> {req.gender}</div>
                          <div><strong className="text-sm">Location:</strong> {req.location}</div>
                          <div><strong className="text-sm">Employment Type:</strong> {req.employmentType}</div>
                          <div><strong className="text-sm">Status:</strong> 
                            <span className={`ml-2 px-2 py-1 text-xs font-bold rounded ${req.accountStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                              {req.accountStatus}
                            </span>
                          </div>
                        </div>

                        {req.accountStatus === 'Pending' && activeReqId !== req._id && (
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleDenyReq(req._id)} disabled={loading}>
                              Deny
                            </Button>
                            <Button onClick={() => setActiveReqId(req._id)} className="bg-emerald-600 hover:bg-emerald-700">
                              Approve...
                            </Button>
                          </div>
                        )}

                        {activeReqId === req._id && (
                          <div className="mt-4 p-4 bg-white border border-emerald-100 rounded-lg shadow-sm">
                            <h4 className="font-bold text-sm text-emerald-800 mb-3">Assign Employee Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="text-xs font-semibold block mb-1 text-slate-400">Employee ID</label>
                                <Input disabled value="Auto-generated upon approval" className="bg-slate-50 text-slate-500 italic" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold block mb-1">Shift</label>
                                <Input value={allowForm.shift} onChange={e => setAllowForm({...allowForm, shift: e.target.value})} placeholder="e.g. Day, Night" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold block mb-1">Monthly Salary</label>
                                <div className="relative">
                                  <Input type="number" value={allowForm.monthlySalary || ""} onChange={e => setAllowForm({...allowForm, monthlySalary: Number(e.target.value)})} placeholder="0" className="pr-8" />
                                  <IndianRupee className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" onClick={() => setActiveReqId("")}>Cancel</Button>
                              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAllowReq(req._id)} disabled={loading}>
                                Confirm Approval
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <Card>
              <CardHeader><CardTitle>Employee Directory</CardTitle></CardHeader>
              <CardContent className="overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr><th>ID</th><th>Name</th><th>Dept</th><th>Sub-Dept</th><th>Status</th><th className="text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp._id} className="border-b">
                        <td className="py-3">{emp.employeeId}</td><td className="font-medium">{emp.name}</td><td>{emp.departmentName}</td><td>{emp.subDepartment || "-"}</td>
                        <td><span className={`px-2 py-1 rounded-full text-xs ${emp.accountStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{emp.accountStatus}</span></td>
                        <td className="text-right space-x-2">
                          <Button size="sm" variant={emp.accountStatus === 'Active' ? 'outline' : 'default'} onClick={() => updateEmpStatus(emp._id, emp.accountStatus === 'Active' ? 'Inactive' : 'Active')}>
                            {emp.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                          </Button>

                          <Button size="sm" variant="destructive" onClick={() => deleteEmployee(emp._id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-product">
            <Card>
              <CardHeader><CardTitle>Add New Product</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Product ID</label>
                    <Input value={prodForm.productId} onChange={e => setProdForm({ ...prodForm, productId: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Name</label>
                    <Input value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Category</label>
                    <select className="w-full h-10 border rounded-md px-3 text-sm bg-white" value={prodForm.category} onChange={e => setProdForm({ ...prodForm, category: e.target.value, subCategory: "" })} required>
                      <option value="">Select Category</option>
                      {Object.keys(PRODUCT_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Sub Category</label>
                    <select className="w-full h-10 border rounded-md px-3 text-sm bg-white" value={prodForm.subCategory} onChange={e => setProdForm({ ...prodForm, subCategory: e.target.value })} disabled={!prodForm.category}>
                      <option value="">Select Sub Category</option>
                      {(PRODUCT_CATEGORIES[prodForm.category] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Type</label>
                    <select className="w-full h-10 border rounded-md px-3 text-sm bg-white" value={prodForm.type} onChange={e => setProdForm({ ...prodForm, type: e.target.value })}>
                      <option value="">Select Type</option>
                      {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Gender</label>
                    <select className="w-full h-10 border rounded-md px-3 text-sm bg-white" value={prodForm.gender} onChange={e => setProdForm({ ...prodForm, gender: e.target.value })}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Age Group</label>
                    <Input value={prodForm.ageGroup} onChange={e => setProdForm({ ...prodForm, ageGroup: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Batch Number</label>
                    <Input value={prodForm.batchNumber} onChange={e => setProdForm({ ...prodForm, batchNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Manufacture Date</label>
                    <Input type="date" value={prodForm.manufactureDate} onChange={e => setProdForm({ ...prodForm, manufactureDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Expiry Date</label>
                    <Input type="date" value={prodForm.expiryDate} onChange={e => setProdForm({ ...prodForm, expiryDate: e.target.value })} />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-1 block">MRP</label>
                    <div className="relative">
                      <Input type="number" value={prodForm.mrp} onChange={e => setProdForm({ ...prodForm, mrp: Number(e.target.value) })} className="pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold pointer-events-none">₹</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Selling Price</label>
                    <div className="relative">
                      <Input type="number" value={prodForm.price} onChange={e => setProdForm({ ...prodForm, price: Number(e.target.value) })} className="pr-8" required />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold pointer-events-none">₹</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Stock Quantity</label>
                    <Input type="number" value={prodForm.stock} onChange={e => setProdForm({ ...prodForm, stock: Number(e.target.value) })} required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Discount</label>
                    <div className="relative">
                      <Input type="number" value={prodForm.discountPercent} onChange={e => setProdForm({ ...prodForm, discountPercent: Number(e.target.value) })} className="pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold pointer-events-none">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Tax</label>
                    <div className="relative">
                      <Input type="number" value={prodForm.taxPercent} onChange={e => setProdForm({ ...prodForm, taxPercent: Number(e.target.value) })} className="pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold pointer-events-none">%</span>
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-sm font-semibold mb-1 block">Ingredients</label>
                    <div className="flex flex-wrap gap-2 border rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                      {INGREDIENTS_LIST.map(ing => (
                        <label key={ing} className="flex items-center gap-2 text-sm bg-slate-50 px-2 py-1 rounded cursor-pointer hover:bg-slate-100">
                          <input 
                            type="checkbox" 
                            checked={prodForm.ingredients.includes(ing)} 
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProdForm({ ...prodForm, ingredients: [...prodForm.ingredients, ing] });
                              } else {
                                setProdForm({ ...prodForm, ingredients: prodForm.ingredients.filter(i => i !== ing) });
                              }
                            }} 
                            className="rounded"
                          />
                          {ing}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-sm font-semibold mb-1 block">Description</label>
                    <Input value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })} />
                  </div>
                  <div className="md:col-span-4"><Button type="submit" className="w-full h-12" disabled={loading}>Add Product</Button></div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader><CardTitle>Product Catalog</CardTitle></CardHeader>
              <CardContent className="overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr><th>Category</th><th>Name</th><th>Price</th><th>Stock</th><th>Status</th><th className="text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id} className="border-b">
                        <td className="py-3">{p.category}</td><td className="font-medium">{p.name}</td><td>{p.price}₹</td><td>{p.stock}</td>
                        <td><span className={`px-2 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.status}</span></td>
                        <td className="text-right">
                          <Button size="sm" variant={p.status === 'active' ? 'outline' : 'default'} onClick={() => updateProdStatus(p._id, p.status === 'active' ? 'inactive' : 'active')}>
                            {p.status === 'active' ? 'Make Inactive' : 'Make Active'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardHeader><CardTitle>Employee Help Requests</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {helpRequests.length === 0 ? <p className="text-muted-foreground text-center py-8">No help requests.</p> : null}
                {helpRequests.map(req => (
                  <div key={req._id} className="border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${req.status === 'Pending' ? 'bg-amber-100 text-amber-800' : req.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{req.status}</span>
                        <h4 className="font-bold">{req.issueType}</h4>
                        <span className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm"><strong>{req.employeeName} ({req.employeeId})</strong> - {req.department} {req.subDepartment ? `/ ${req.subDepartment}` : ""}</p>
                      <p className="text-sm mt-1">📞 {req.phoneNumber}</p>
                      <div className="mt-3 p-3 bg-slate-50 rounded text-sm text-slate-700">{req.description}</div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      <Button size="sm" variant="outline" onClick={() => updateHelpStatus(req._id, 'In Progress')} disabled={req.status === 'In Progress'}>Mark In Progress</Button>
                      <Button size="sm" variant="default" onClick={() => updateHelpStatus(req._id, 'Resolved')} disabled={req.status === 'Resolved'}>Mark Resolved</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-teal-500" /> Customer Feedback from Employees</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {customerFeedbacks.length === 0 ? <p className="text-muted-foreground text-center py-8">No customer feedback submitted yet.</p> : null}
                {customerFeedbacks.map(fb => (
                  <div key={fb._id} className="border rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-slate-800">{fb.customerName || "Anonymous Customer"}</h4>
                        <p className="text-xs text-muted-foreground">Submitted by <span className="font-semibold text-blue-600">{fb.employeeName}</span> ({fb.employeeId})</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {fb.rating ? Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                        )) : <span className="text-xs text-slate-400">No rating</span>}
                      </div>
                    </div>
                    <div className="mt-2 p-3 bg-slate-50 rounded text-sm text-slate-700 whitespace-pre-wrap">{fb.feedback}</div>
                    <p className="text-xs text-muted-foreground mt-2 text-right">{new Date(fb.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HRLayout>
  );
}
