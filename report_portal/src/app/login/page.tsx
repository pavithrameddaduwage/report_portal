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
import { Lock, User, Loader2, ArrowRight, LayoutGrid } from 'lucide-react';

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
    <div className="flex min-h-screen bg-white font-sans">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex w-[45%] bg-[#081323] relative flex-col justify-between overflow-hidden">
        {/* Top Logo */}
        <div className="p-12 z-10 flex items-center">
          <img
            src="/logo.png"
            alt="Horizon Logo"
            className="w-16 h-16 object-contain drop-shadow-sm brightness-0 invert"
          />
        </div>

        {/* Center Content */}
        <div className="px-12 z-10 flex flex-col justify-center flex-1 pb-24">
          <h1 className="text-white text-[42px] font-bold leading-[1.1]">
            Horizon Group USA <br />
            <span className="text-[#4eb4eb]">Report Portal</span>
          </h1>
        </div>

        {/* Bottom Wavy Graphics */}
        <div className="absolute bottom-0 left-0 right-0 h-64 z-0 overflow-hidden">
          <style>{`
            @keyframes waveAnim {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-wave {
              animation: waveAnim 20s linear infinite;
            }
            .animate-wave-slow {
              animation: waveAnim 25s linear infinite;
            }
          `}</style>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b5082]/60 to-transparent"></div>
          <svg className="absolute bottom-0 w-[200%] h-full object-cover opacity-60 animate-wave" viewBox="0 0 2880 320" preserveAspectRatio="none">
            <path fill="#216298" fillOpacity="0.6" d="M0,192L60,186.7C120,181,240,171,360,186.7C480,203,600,245,720,240C840,235,960,181,1080,165.3C1200,149,1320,171,1380,181.3L1440,192L1500,186.7C1560,181,1680,171,1800,186.7C1920,203,2040,245,2160,240C2280,235,2400,181,2520,165.3C2640,149,2760,171,2820,181.3L2880,192L2880,320L2820,320C2760,320,2640,320,2520,320C2400,320,2280,320,2160,320C2040,320,1920,320,1800,320C1680,320,1560,320,1500,320L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
          <svg className="absolute bottom-0 w-[200%] h-full object-cover opacity-60 animate-wave-slow" viewBox="0 0 2880 320" preserveAspectRatio="none">
            <path fill="#081323" fillOpacity="0.3" d="M0,224L60,229.3C120,235,240,245,360,229.3C480,213,600,171,720,170.7C840,171,960,213,1080,229.3C1200,245,1320,235,1380,229.3L1440,224L1500,229.3C1560,235,1680,245,1800,229.3C1920,213,2040,171,2160,170.7C2280,171,2400,213,2520,229.3C2640,245,2760,235,2820,229.3L2880,224L2880,320L2820,320C2760,320,2640,320,2520,320C2400,320,2280,320,2160,320C2040,320,1920,320,1800,320C1680,320,1560,320,1500,320L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-0">
        <div className="w-full max-w-[420px]">
          
          <div className="mb-8">
            <h3 className="text-[12px] text-[#5c7f9f] font-semibold mb-1">Report Portal</h3>
            <h1 className="text-3xl font-bold text-[#0d2745] mb-2 tracking-tight">Welcome back</h1>
            <p className="text-[13px] text-[#5c7f9f]">
              Sign in with your corporate domain credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#0d2745] block">
                Username or email
              </label>
              <div className="relative">
                <Input
                  {...register('username')}
                  type="text"
                  placeholder="***@hgusa.com"
                  disabled={isLoading}
                  className="h-11 text-[13px] pr-10 border-b border-t-0 border-x-0 border-[#dce6f1] rounded-none px-0 text-[#0f2b48] placeholder:text-[#a0b3c6] focus-visible:ring-0 focus-visible:border-[#0d2745] bg-transparent transition-colors shadow-none"
                />
                <User className="w-4 h-4 text-[#a0b3c6] absolute right-2 top-3.5 pointer-events-none" />
              </div>
              {errors.username && (
                <p className="text-red-500 text-[11px] font-medium mt-1">{String(errors.username.message)}</p>
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
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="h-11 text-[13px] pr-10 border-b border-t-0 border-x-0 border-[#dce6f1] rounded-none px-0 text-[#0f2b48] placeholder:text-[#a0b3c6] focus-visible:ring-0 focus-visible:border-[#0d2745] bg-transparent transition-colors shadow-none"
                />
                <Lock className="w-4 h-4 text-[#a0b3c6] absolute right-2 top-3.5 pointer-events-none" />
              </div>
              {errors.password && (
                <p className="text-red-500 text-[11px] font-medium mt-1">{String(errors.password.message)}</p>
              )}
            </div>
            
            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="rounded border-gray-300 text-[#0d2745] focus:ring-[#0d2745]" />
                <span className="text-[12px] text-[#5c7f9f] group-hover:text-[#0d2745] transition-colors">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-4 text-[13px] font-bold rounded-md bg-[#081323] hover:bg-[#0d2745] text-white transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-[1px] bg-[#edf3f9]"></div>
            <span className="text-[11px] text-[#8aa6bf] font-medium">If you are unable to login please contact the admin</span>
            <div className="flex-1 h-[1px] bg-[#edf3f9]"></div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-[#8aa6bf] mt-16 font-medium">
            Powered by <span className="text-[#0d2745] font-bold">Team MIS</span> • © 2026 Team MIS. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}