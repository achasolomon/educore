// src/app/not-found.tsx
'use client';

import { useRouter } from 'next/navigation';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-primary-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <FileQuestion className="h-8 w-8 text-primary-600" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-neutral-600">
            The page you're looking for doesn't exist or has been moved.
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