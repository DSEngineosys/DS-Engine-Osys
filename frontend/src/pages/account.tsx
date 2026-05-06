import { useState, useEffect } from "react";
import { FlipchartLayout } from "@/components/flipchart-layout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LogOut, Settings, User, Shield, ChevronRight, Loader2 } from "lucide-react";
import { ProfileCard } from "@/components/profile-card";
import { api } from "@/lib/api-extra";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const [activePhase, setActivePhase] = useState<"employee" | "product">("employee");
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [mobile, setMobile] = useState((user as any)?.mobile || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setMobile((user as any).mobile || "");
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setBusy(true);
    try {
      await api.updateProfile({ name, mobile: mobile || null });
      await refreshUser();
      setIsProfileOpen(false);
      toast({ title: "Profile updated successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <FlipchartLayout activePhase={activePhase} onPhaseChange={setActivePhase}>
      <div className="space-y-6 pb-12">
        <header className="text-center pt-4">
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 border-4 border-white shadow-xl mx-auto">
              <AvatarImage src={(user as any)?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-white text-3xl font-black">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-4">{user?.name}</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{user?.role.replace('_', ' ')}</p>
        </header>

        <section className="space-y-3">
          <ProfileCard />
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Settings</h3>
          
          <Card 
            className="rounded-3xl border-slate-100 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => setIsProfileOpen(true)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700">Profile Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700">Security</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </CardContent>
          </Card>

          <Button 
            variant="ghost" 
            onClick={logout}
            className="w-full h-14 rounded-2xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-black justify-between px-4 mt-4"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              Sign Out
            </div>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </section>
      </div>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
              <Input 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</Label>
              <Input 
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="h-12 rounded-2xl bg-slate-50 border-none shadow-inner font-bold"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleUpdateProfile} 
              disabled={busy || !name}
              className="w-full h-14 rounded-2xl font-black text-lg shadow-lg"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FlipchartLayout>
  );
}
