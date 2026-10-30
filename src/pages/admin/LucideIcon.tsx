import React from 'react';
import * as Icons from 'lucide-react';

// Admin-only: renders an icon chosen by name. The icon picker here lets an admin
// browse the whole set, so this is the one place that legitimately needs the full
// barrel import — it is why AdminPage is a lazy, admin-only route.
export const LucideIcon = ({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) => {
  const Icon = (Icons as any)[name] || Icons.Layout;
  return <Icon size={size} className={className} />;
};
