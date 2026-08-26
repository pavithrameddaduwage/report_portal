'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/services/authentication-service';
import { toast } from 'sonner';
import { Lock, User, Loader2, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(2, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await login({ email: data.username.trim(), password: data.password });

      if (response.status === 200 && response.data?.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        toast.success("Welcome back!");
        router.push("/workspaces");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      toast.error("Authentication Failed", {
        description: error.response?.data?.message || "Invalid username or password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f9fc] p-4 font-sans relative overflow-hidden">
      {/* Background soft ambient shapes */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#eaf4fd] rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#e3eef8] rounded-full blur-3xl opacity-70 pointer-events-none" />

      <div className="w-full max-w-[390px] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-7 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-[#0b2138] text-white flex items-center justify-center font-bold text-xl shadow-md mb-3">
            <span className="text-[#2f8fe0]">H</span>
          </div>
          <span className="text-[12px] font-bold text-[#0b2138] tracking-widest uppercase">
            HORIZON GROUP USA
          </span>
          <h1 className="text-[22px] font-bold text-[#0a1c30] mt-0.5 tracking-tight">
            Report Portal
          </h1>
          <p className="text-xs text-[#5c7f9f] mt-1">
            Sign in with your corporate domain credentials
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-[#dce6f1] p-7 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#0d2745] block">
                Username / Email
              </label>
              <div className="relative">
                <Input
                  {...register('username')}
                  type="text"
                  placeholder="e.g. jdoe or jdoe@hgusa.com"
                  disabled={isLoading}
                  className="h-9 text-xs pl-8 border-[#dce6f1] text-[#0f2b48] placeholder:text-[#8aa6bf] rounded-lg shadow-2xs focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                />
                <User className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-3 pointer-events-none" />
              </div>
              {errors.username && (
                <p className="text-red-500 text-[11px] font-medium">{String(errors.username.message)}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#0d2745] block">
                Password
              </label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="h-9 text-xs pl-8 border-[#dce6f1] text-[#0f2b48] placeholder:text-[#8aa6bf] rounded-lg shadow-2xs focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                />
                <Lock className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-3 pointer-events-none" />
              </div>
              {errors.password && (
                <p className="text-red-500 text-[11px] font-medium">{String(errors.password.message)}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 mt-2 text-xs font-semibold rounded-lg bg-[#0b2138] hover:bg-[#163e6b] text-white shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-[#8aa6bf] mt-6 flex flex-col items-center gap-0.5 select-none">
          <div className="flex items-center gap-1 text-[11px] text-[#5c7f9f]">
            <span>Powered by</span>
            <span className="font-semibold text-[#0b2138]">Team MIS</span>
          </div>
          <span>© Copyright Team MIS</span>
        </div>
      </div>
    </div>
  );
}