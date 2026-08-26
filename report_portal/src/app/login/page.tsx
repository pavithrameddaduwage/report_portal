'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/services/authentication-service';
import { toast } from "sonner"

const loginSchema = z.object({
  username: z.string().min(4,{message: 'Invalid user address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function LoginPage() {
    // const { data: session,status } = useSession();
    const router = useRouter(); 


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });


  const onSubmit = async (data: any) => {
    console.log('Login Data:', data);
    try {
      const response = await login({ email: data.username, password: data.password });
  
      if (response.status === 200) {
        localStorage.setItem("access_token", response.data.access_token);
        router.push("/workspaces");
      }
    } catch (error: any) {
      toast.error("Login Failed", {
        description: "Please check your username and password",
      });
    }
  };

  return (
<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-t from-cyan-900 to-[#00b2e6]">

        <div className="text-2xl font-thin text-center w-full mb-2 text-white">Horizon Report Portal</div>
      <Card className="w-full max-w-xs shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                {...register('username')}
                type="text"
                placeholder="User Name"
                className="w-full"
              />
              {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
            </div>
            <div>
              <Input
                {...register('password')}
                type="password"
                placeholder="Password"
                className="w-full"
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-[#055c9d] mb-6">Login</Button>
          </form>
        </CardContent>
      </Card>
      <div className='text-white text-xs mt-2'>Powered by Team MIS</div>
    </div>
  );
}