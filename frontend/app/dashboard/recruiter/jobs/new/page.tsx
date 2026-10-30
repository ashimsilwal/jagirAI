'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewJobRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/recruiter/jobs?create=1');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
      <p className="text-xs text-slate-500 font-medium">Opening My Jobs...</p>
    </div>
  );
}
