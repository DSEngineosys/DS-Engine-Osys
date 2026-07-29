import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PublicLayout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, KeyRound, CheckCircle2, Phone, ShieldCheck, ArrowLeft, MessageSquare } from "lucide-react";
import { api } from "@/lib/api-extra";
import { motion, AnimatePresence } from "framer-motion";
import { useCountdown } from "@/hooks/use-countdown";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLoginUser();
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<"request" | "otp" | "verified" | "reset">("request");
  const [identifier, setIdentifier] = useState("");
  const [forgotData, setForgotData] = useState<{ email: string; mobile: string; maskedMobile: string; otp?: string; name: string } | null>(null);
  const [otpExpiryDate, setOtpExpiryDate] = useState<Date | null>(null);
  const { isExpired: isOtpExpired, seconds: otpSeconds, minutes: otpMinutes } = useCountdown(otpExpiryDate);
  const [userEnteredOtp, setUserEnteredOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({
            title: "Login successful",
            description: "Welcome back to DS Engineosys.",
          });
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error?.message || "Invalid credentials. Please try again.",
          });
        },
      }
    );
  }

  async function handleRequestOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!identifier.trim()) return;
    setBusy(true);
    try {
      const res = await api.forgotPasswordRequestOtp(identifier);
      setForgotData(res);
      setForgotStep("otp");
      setOtpExpiryDate(new Date(Date.now() + 60 * 1000));
      toast({
        title: "SMS Verification OTP Sent",
        description: `OTP sent to registered mobile number ${res.maskedMobile}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification Request Failed",
        description: err?.message || "Could not find registered account.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!userEnteredOtp.trim() || !forgotData?.email) return;
    setBusy(true);
    try {
      await api.forgotPasswordVerifyOtp({
        email: forgotData.email,
        otp: userEnteredOtp.trim(),
      });
      setForgotStep("verified");
      setTimeout(() => {
        setForgotStep("reset");
      }, 1200);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "OTP Verification Failed",
        description: err?.message || "The OTP code entered is incorrect.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const isStrong =
      newPassword.length >= 8 &&
      newPassword.length <= 15 &&
      /[0-9]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /[@#$%]/.test(newPassword);

    if (!isStrong) {
      toast({
        variant: "destructive",
        title: "Weak password",
        description: "Password must satisfy all requirements (8-15 chars, number, uppercase, lowercase, special char).",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "New password and confirmation password do not match.",
      });
      return;
    }

    setBusy(true);
    try {
      await api.forgotPasswordReset({
        email: forgotData!.email,
        password: newPassword,
      });
      toast({
        title: "Password Created Successfully!",
        description: "Your new password is active. You can now sign in.",
      });
      setShowForgotModal(false);
      setForgotStep("request");
      form.setValue("email", forgotData!.email);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: err?.message || "Failed to update password.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-slate-100 relative">
          <div>
            <div className="mx-auto w-16 h-16 bg-primary text-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-md mb-6">
              DS
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Access the DS Engineosys command center
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="engineer@company.com"
                          type="email"
                          autoComplete="email"
                          data-testid="input-login-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            data-testid="input-login-password"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-md"
                disabled={loginMutation.isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>

          {/* Forgot Password Link at bottom */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotStep("request");
              }}
              className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1.5 mx-auto"
            >
              <KeyRound className="w-3.5 h-3.5" /> Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Workflow Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden"
            >
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center"
              >
                ✕
              </button>

              {/* Step 1: Request OTP */}
              {forgotStep === "request" && (
                <form onSubmit={handleRequestOtp} className="space-y-4 pt-2">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Forgot Password</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Enter your registered Email address or Mobile number to receive an SMS verification OTP.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="forgot-identifier">Registered Email or Mobile</Label>
                    <Input
                      id="forgot-identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="engineer@company.com or 9876543210"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 font-bold" disabled={busy}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                    Send Verification OTP
                  </Button>
                </form>
              )}

              {/* Step 2: OTP Verification */}
              {forgotStep === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">OTP Verification</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Verification code sent to registered email <span className="font-bold text-slate-700">{forgotData?.email}</span> & mobile <span className="font-bold text-slate-700">{forgotData?.maskedMobile}</span>
                    </p>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 text-center">
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                      Please check your inbox at <strong className="font-bold">{forgotData?.email}</strong> or mobile text messages for your 6-digit verification code.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp-input">Enter 6-Digit OTP</Label>
                    <Input
                      id="otp-input"
                      value={userEnteredOtp}
                      onChange={(e) => setUserEnteredOtp(e.target.value)}
                      placeholder="Enter OTP (e.g. 482910)"
                      className="text-center text-lg font-mono tracking-widest font-bold"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => { setForgotStep("request"); setOtpExpiryDate(null); }} className="flex-1">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                      <Button type="submit" className="flex-1 font-bold" disabled={isOtpExpired || busy}>
                        Verify OTP
                      </Button>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => handleRequestOtp()} 
                      disabled={!isOtpExpired || busy}
                      className="w-full text-sm font-bold text-slate-500 hover:text-slate-700"
                    >
                      {isOtpExpired ? "Resend OTP" : `Resend OTP in 00:${String(otpSeconds).padStart(2, '0')}`}
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 3: Verification Done — Live Visual Green Tick */}
              {forgotStep === "verified" && (
                <div className="py-8 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-12 h-12" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-slate-900">Mobile Verified Successfully!</h3>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                    Identity Authorized · Granting Password Permission
                  </p>
                </div>
              )}

              {/* Step 4: Generate New Password & Rules */}
              {forgotStep === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-black text-slate-900">Generate New Password</h3>
                    <p className="text-xs text-slate-500 font-medium">Account: {forgotData?.email}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="new-pwd">New Password</Label>
                      <Input
                        id="new-pwd"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                    </div>

                    {/* Password Rules */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password Requirements</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { label: "8-15 Characters", valid: newPassword.length >= 8 && newPassword.length <= 15 },
                          { label: "At least one Number (0-9)", valid: /[0-9]/.test(newPassword) },
                          { label: "Uppercase & Lowercase Letter", valid: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) },
                          { label: "One Special Character (@, #, $, %)", valid: /[@#$%]/.test(newPassword) },
                        ].map((cond, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${cond.valid ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300"}`}>
                              {cond.valid && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-[11px] font-medium ${cond.valid ? "text-emerald-600" : "text-slate-500"}`}>{cond.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirm-pwd">Confirm Password</Label>
                      <Input
                        id="confirm-pwd"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-[11px] font-bold text-rose-500 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 font-bold bg-gradient-to-r from-primary to-pink-500 text-white" disabled={busy}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                    Create Password & Sign In
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PublicLayout>
  );
}
