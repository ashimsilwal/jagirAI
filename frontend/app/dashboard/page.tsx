'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardIndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.is_staff || user.is_superuser) {
        router.replace('/dashboard/admin');
      } else if (user.role === 'JOB_RECRUITER') {
        router.replace('/dashboard/recruiter');
      } else {
        router.replace('/dashboard/seeker');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
    </div>
  );
}
