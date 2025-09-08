// src/app/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/forms/Input';
import { Alert } from '@/components/ui/feedback/Alert';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Password reset requested for:', data.email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <Mail className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Check Your Email</h1>
        <p className="text-neutral-600 mb-6">
          We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => setIsSuccess(false)}
            variant="outline"
            className="w-full"
          >
            Resend Email
          </Button>
          <a href="/login" className="block">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <Mail className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Forgot Password?</h1>
        <p className="text-neutral-600">
          Don't worry, we'll send you reset instructions via email.
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="Enter your email address"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isLoading}
        >
          Send Reset Instructions
        </Button>
      </form>

      <div className="mt-6 text-center">
        <a href="/login" className="text-sm text-neutral-600 hover:text-neutral-800 flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Sign In
        </a>
      </div>
    </div>
  );
}