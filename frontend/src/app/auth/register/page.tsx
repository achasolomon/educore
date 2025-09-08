// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Building, Eye, EyeOff, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/forms/Input';
import { Alert } from '@/components/ui/feedback/Alert';

const registerSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  subscription: z.enum(['standard', 'premium']),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      subscription: 'standard',
    },
  });

  const subscription = watch('subscription');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Registration data:', data);
      // Handle successful registration
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">SM</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Create School Account</h1>
        <p className="text-neutral-600">Start your 30-day free trial today</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* School Information */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">School Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="School Name"
              leftIcon={<Building className="h-4 w-4" />}
              placeholder="Enter school name"
              error={errors.schoolName?.message}
              {...register('schoolName')}
            />
            <Input
              label="Administrator Name"
              leftIcon={<User className="h-4 w-4" />}
              placeholder="Enter admin name"
              error={errors.adminName?.message}
              {...register('adminName')}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              leftIcon={<Mail className="h-4 w-4" />}
              placeholder="Enter email address"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Phone Number"
              type="tel"
              leftIcon={<Phone className="h-4 w-4" />}
              placeholder="Enter phone number"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              placeholder="Confirm password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
        </div>

        {/* Subscription Plan */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Choose Your Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Plan */}
            <label className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors ${
              subscription === 'standard' 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-neutral-200 hover:border-neutral-300'
            }`}>
              <input
                type="radio"
                value="standard"
                {...register('subscription')}
                className="sr-only"
              />
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold">Standard Plan</h4>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">₦15,000</p>
                  <p className="text-sm text-neutral-500">per month</p>
                </div>
              </div>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Up to 500 students</li>
                <li>• Basic gradebook</li>
                <li>• Manual attendance</li>
                <li>• 100 SMS/month</li>
                <li>• 5 pre-built reports</li>
              </ul>
            </label>

            {/* Premium Plan */}
            <label className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors ${
              subscription === 'premium' 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-neutral-200 hover:border-neutral-300'
            }`}>
              <input
                type="radio"
                value="premium"
                {...register('subscription')}
                className="sr-only"
              />
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold">Premium Plan</h4>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">₦45,000</p>
                  <p className="text-sm text-neutral-500">per month</p>
                </div>
              </div>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Unlimited students</li>
                <li>• Advanced analytics</li>
                <li>• QR code attendance</li>
                <li>• Unlimited SMS</li>
                <li>• Custom reports</li>
                <li>• Priority support</li>
              </ul>
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                Popular
              </div>
            </label>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            {...register('agreeToTerms')}
            className="mt-1 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          <div className="text-sm text-neutral-600">
            <p>
              I agree to the{' '}
              <a href="/terms" className="text-primary-600 hover:text-primary-700">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </a>
            </p>
            {errors.agreeToTerms && (
              <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isLoading}
        >
          Start Free Trial
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Already have an account?{' '}
          <a href="/login" className="text-primary-500 hover:text-primary-600 font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}