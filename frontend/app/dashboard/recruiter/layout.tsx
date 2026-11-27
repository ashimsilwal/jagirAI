'use client';

import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard requiredRole="JOB_RECRUITER">{children}</AuthGuard>;
}
