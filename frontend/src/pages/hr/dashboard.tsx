import { HRLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Package, HelpCircle, Mail, Settings, RefreshCcw } from "lucide-react";

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
  const [products, setProducts] = useState<any[]>([]);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [emailSettings, setEmailSettings] = useState({ hrEmail: "", hrAppPassword: "" });
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms state
  const [empForm, setEmpForm] = useState({
    employeeId: "", name: "", email: "", password: "", departmentId: "", 
    subDepartment: "General", contactNumber: "+91 ", gender: "Male", location: "", employmentType: "Fulltime", shift: "", monthlySalary: 0
  });
  const [prodForm, setProdForm] = useState<{
    productId: string; name: string; category: string; subCategory: string; type: string; description: string; ingredients: string[]; ageGroup: string; gender: string; manufactureDate: string; expiryDate: string; batchNumber: string; mrp: number; discountPercent: number; taxPercent: number; price: number; stock: number;
  }>({
    productId: "", name: "", category: "", subCategory: "", type: "", description: "", ingredients: [], ageGroup: "", gender: "Other", manufactureDate: "", expiryDate: "", batchNumber: "", mrp: 0, discountPercent: 0, taxPercent: 0, price: 0, stock: 0
  });

  const fetchData = async () => {
    try {
      const [empRes, prodRes, helpRes, settingsRes, deptRes] = await Promise.all([
        fetch("/api/hr/employees"), fetch("/api/hr/products"), fetch("/api/hr/help-requests"), fetch("/api/hr/settings/email"), fetch("/api/departments")
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (helpRes.ok) setHelpRequests(await helpRes.json());
      if (settingsRes.ok) setEmailSettings(await settingsRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch (e) {
      console.error("Failed to fetch HR data", e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleHireEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/hr/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(empForm) });
      if (!res.ok) throw new Error((await res.json()).message);
      toast({ title: "Employee Hired" });
      fetchData();
      setEmpForm({ ...empForm, employeeId: "", name: "", email: "", password: "", contactNumber: "+91 ", departmentId: "" });
    } catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.message }); }
    finally { setLoading(false); }
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

  const resetEmpPassword = async (id: string) => {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;
    await fetch(`/api/hr/employees/${id}/reset-password`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword }) });
    toast({ title: "Password Reset" });
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
        <div>
          <h2 className="text-3xl font-bold">HR Management Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-slate-100">
            <TabsTrigger value="overview" className="py-3">Overview</TabsTrigger>
            <TabsTrigger value="hire" className="py-3">Hire Employee</TabsTrigger>
            <TabsTrigger value="employees" className="py-3">Employee List</TabsTrigger>
            <TabsTrigger value="add-product" className="py-3">Add Product</TabsTrigger>
            <TabsTrigger value="products" className="py-3">Product List</TabsTrigger>
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

            <Card className="md:col-span-3 mt-4">
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings /> SMTP Email Settings</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={saveSettings} className="flex gap-4 items-end">
                  <div className="flex-1"><label className="text-sm font-semibold mb-1 block">HR Email Address</label>
                    <Input value={emailSettings.hrEmail} onChange={e => setEmailSettings({ ...emailSettings, hrEmail: e.target.value })} required type="email" placeholder="hr@company.com" />
                  </div>
                  <div className="flex-1"><label className="text-sm font-semibold mb-1 block">Google App Password</label>
                    <Input value={emailSettings.hrAppPassword} onChange={e => setEmailSettings({ ...emailSettings, hrAppPassword: e.target.value })} type="password" placeholder="••••••••" />
                  </div>
                  <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Save"}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hire">
            <Card>
              <CardHeader><CardTitle>Hire New Employee</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleHireEmployee} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="text-sm font-semibold mb-1 block">Employee ID</label><Input value={empForm.employeeId} onChange={e => setEmpForm({...empForm, employeeId: e.target.value})} required /></div>
                  <div><label className="text-sm font-semibold mb-1 block">Name</label><Input value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} required /></div>
                  <div><label className="text-sm font-semibold mb-1 block">Email</label><Input type="email" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} required /></div>
                  <div><label className="text-sm font-semibold mb-1 block">Password</label><Input type="password" value={empForm.password} onChange={e => setEmpForm({...empForm, password: e.target.value})} required /></div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Department</label>
                    <select className="w-full h-10 border rounded-md px-3 text-sm bg-white" value={empForm.departmentId} onChange={e => setEmpForm({...empForm, departmentId: e.target.value, subDepartment: ""})} required>
                      <option value="">-- Select Department --</option>
                      {departments.filter(d => !d.parentId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Sub Department</label>
                    <select className="w-full h-10 border rounded-md px-3 text-sm bg-white" value={empForm.subDepartment} onChange={e => setEmpForm({...empForm, subDepartment: e.target.value})} disabled={!empForm.departmentId}>
                      <option value="">-- Select Sub Department --</option>
                      {departments.filter(d => d.parentId === empForm.departmentId).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Contact Number</label>
                    <Input value={empForm.contactNumber} onChange={e => {
                      const val = e.target.value;
                      if (!val.startsWith("+91 ")) {
                        setEmpForm({...empForm, contactNumber: "+91 "});
                      } else {
                        setEmpForm({...empForm, contactNumber: val});
                      }
                    }} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Gender</label>
                    <select className="w-full h-10 border rounded-md px-3 text-sm bg-white" value={empForm.gender} onChange={e => setEmpForm({...empForm, gender: e.target.value})}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div><label className="text-sm font-semibold mb-1 block">Location</label><Input value={empForm.location} onChange={e => setEmpForm({...empForm, location: e.target.value})} /></div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Employment Type</label>
                    <select className="w-full h-10 border rounded-md px-3 text-sm bg-white" value={empForm.employmentType} onChange={e => setEmpForm({...empForm, employmentType: e.target.value})}>
                      <option value="Fulltime">Fulltime</option>
                      <option value="Parttime">Parttime</option>
                      <option value="Contract based">Contract based</option>
                    </select>
                  </div>
                  
                  <div><label className="text-sm font-semibold mb-1 block">Shift</label><Input value={empForm.shift} onChange={e => setEmpForm({...empForm, shift: e.target.value})} /></div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Monthly Salary</label>
                    <div className="relative">
                      <Input type="number" className="pr-8" value={empForm.monthlySalary || ""} onChange={e => setEmpForm({...empForm, monthlySalary: Number(e.target.value)})} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold pointer-events-none">₹</span>
                    </div>
                  </div>

                  <div className="md:col-span-3"><Button type="submit" className="w-full h-12" disabled={loading}>Hire Employee</Button></div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <Card>
              <CardHeader><CardTitle>Employee Directory</CardTitle></CardHeader>
              <CardContent className="overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr><th>ID</th><th>Name</th><th>Dept</th><th>Status</th><th className="text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp._id} className="border-b">
                        <td className="py-3">{emp.employeeId}</td><td className="font-medium">{emp.name}</td><td>{emp.departmentName}</td>
                        <td><span className={`px-2 py-1 rounded-full text-xs ${emp.accountStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{emp.accountStatus}</span></td>
                        <td className="text-right space-x-2">
                          <Button size="sm" variant={emp.accountStatus === 'Active' ? 'outline' : 'default'} onClick={() => updateEmpStatus(emp._id, emp.accountStatus === 'Active' ? 'Inactive' : 'Active')}>
                            {emp.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => resetEmpPassword(emp._id)}><RefreshCcw className="w-4 h-4" /></Button>
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
        </Tabs>
      </div>
    </HRLayout>
  );
}
