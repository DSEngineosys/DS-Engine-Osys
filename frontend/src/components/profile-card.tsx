import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Image as ImageIcon, Link2, Loader2, Upload, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, CurrentUserExtended } from "@/lib/api-extra";

const MAX_BYTES = 2_000_000; // ~2 MB before base64 expansion

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ProfileCard() {
  const { toast } = useToast();
  const [me, setMe] = useState<CurrentUserExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const data = await api.me();
      setMe(data);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveAvatar(avatarUrl: string) {
    setBusy(true);
    try {
      await api.uploadAvatar(avatarUrl);
      await load();
      setOpen(false);
      setUrlInput("");
      toast({ title: "Profile photo updated" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try a smaller image.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast({
        variant: "destructive",
        title: "Image too large",
        description: "Pick an image under 2 MB.",
      });
      return;
    }
    const dataUrl = await fileToDataUrl(f);
    await saveAvatar(dataUrl);
  }

  async function handleUrl() {
    const v = urlInput.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) {
      toast({
        variant: "destructive",
        title: "Bad URL",
        description: "Paste an http(s) image URL.",
      });
      return;
    }
    await saveAvatar(v);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-100 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-56 bg-slate-100 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!me) return null;

  const initials = me.name
    .split(" ")
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-pink-100 bg-gradient-to-r from-blue-50/50 via-white to-pink-50/50">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-5">
            <div className="relative">
              <Avatar className="w-20 h-20 ring-4 ring-white shadow-md">
                {me.avatarUrl ? (
                  <AvatarImage src={me.avatarUrl} alt={me.name} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary to-pink-400 text-white text-xl font-bold">
                  {initials || <UserCircle2 className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow hover:scale-105 transition-transform"
                aria-label="Change profile photo"
                data-testid="button-change-avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-primary/70 font-semibold">
                Welcome back
              </p>
              <h2 className="text-xl md:text-2xl font-extrabold mt-0.5 truncate">{me.name}</h2>
              <p className="text-sm text-muted-foreground truncate">
                {me.email}
                {me.mobile ? <> · {me.mobile}</> : null}
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                Role: {me.role.replace(/_/g, " ")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              data-testid="button-open-photo-dialog"
            >
              <Camera className="w-4 h-4 mr-2" /> Update photo
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update profile photo</DialogTitle>
            <DialogDescription>
              Choose a source — take a new photo, pick a file from your device, or paste an image URL.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              className="justify-start h-12"
              onClick={() => cameraRef.current?.click()}
              disabled={busy}
              data-testid="button-source-camera"
            >
              <Camera className="w-5 h-5 mr-3 text-primary" /> Take a photo (camera)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start h-12"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              data-testid="button-source-file"
            >
              <ImageIcon className="w-5 h-5 mr-3 text-primary" /> Pick from device / gallery
            </Button>

            <div className="rounded-lg border p-3 space-y-2">
              <Label htmlFor="avatar-url" className="text-xs flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Or paste an image URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="avatar-url"
                  placeholder="https://example.com/avatar.png"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  data-testid="input-avatar-url"
                />
                <Button onClick={handleUrl} disabled={busy || !urlInput.trim()} data-testid="button-use-url">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFile}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
