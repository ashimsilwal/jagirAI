'use client';

import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard requireAdmin={true}>{children}</AuthGuard>;
}
