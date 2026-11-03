import React from 'react';
import {
  Briefcase,
  Building2,
  Users,
  Award,
  Target,
  Compass,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
  Heart,
  Star,
  CheckCircle2,
  Globe,
  Rocket,
  Eye,
  Clock,
  BookOpen,
  Layers,
  Lightbulb,
  Smile,
  Cpu,
  FileCheck,
  BadgeCheck,
  Check,
  UserCheck,
  Share2,
  Bookmark,
  LucideProps,
  HelpCircle
} from 'lucide-react';

export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Briefcase,
  Building2,
  Users,
  Award,
  Target,
  Compass,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
  Heart,
  Star,
  CheckCircle2,
  Globe,
  Rocket,
  Eye,
  Clock,
  BookOpen,
  Layers,
  Lightbulb,
  Smile,
  Cpu,
  FileCheck,
  BadgeCheck,
  Check,
  UserCheck,
  Share2,
  Bookmark,
};

export const AVAILABLE_ICON_NAMES = Object.keys(ICON_MAP);

interface DynamicIconProps extends LucideProps {
  name: string;
  customIconUrl?: string | null;
  alt?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  customIconUrl,
  alt = 'Icon',
  className,
  ...props
}) => {
  const effectiveUrl = customIconUrl || (
    name && (name.startsWith('http://') || name.startsWith('https://') || name.startsWith('/media/') || name.startsWith('data:image/'))
      ? name
      : null
  );

  if (effectiveUrl) {
    return (
      <img
        src={effectiveUrl}
        alt={alt}
        className={`${className || 'w-6 h-6'} object-contain rounded-sm`}
      />
    );
  }

  // Try exact match or case-insensitive match
  const normalizedKey = Object.keys(ICON_MAP).find(
    (k) => k.toLowerCase() === (name || '').toLowerCase()
  );
  const IconComponent = normalizedKey ? ICON_MAP[normalizedKey] : Sparkles;
  return <IconComponent className={className} {...props} />;
};

