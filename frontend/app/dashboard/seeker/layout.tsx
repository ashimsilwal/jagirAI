'use client';

import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';

export default function SeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard requiredRole="JOB_SEEKER">{children}</AuthGuard>;
}
