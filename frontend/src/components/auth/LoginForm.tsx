// src/components/auth/LoginForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/forms/Input';
import { Alert } from '../ui/feedback/Alert';
import { useAuthStore } from '../../lib/stores/authStore';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">SM</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Welcome Back</h1>
        <p className="text-neutral-600">Sign in to your school management account</p>
      </div>

      {error && (
        <Alert className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="Enter your email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500" />
            <span className="ml-2 text-sm text-neutral-600">Remember me</span>
          </label>
          <a href="/auth/forgot-password" className="text-sm text-primary-500 hover:text-primary-600">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Don't have an account?{' '}
          <a href="/auth/register" className="text-primary-500 hover:text-primary-600 font-medium">
            Contact your administrator
          </a>
        </p>
      </div>
    </div>
  );
}