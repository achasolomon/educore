// src/app/unauthorized/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-error-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-error-600" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-neutral-600">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="space-y-2">
            <Button
              onClick={() => router.back()}
              className="w-full"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Go Back
            </Button>
            
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
              leftIcon={<Home className="h-4 w-4" />}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
