import {
  Award,
  CalendarDays,
  Disc3,
  GraduationCap,
  Headphones,
  Heart,
  MapPin,
  Mic2,
  Music,
  Radio,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";
import type { LandingIcon } from "@/lib/landing-content";

export const landingIcons: Record<LandingIcon, ComponentType<LucideProps>> = {
  music: Music,
  users: Users,
  trophy: Trophy,
  mic: Mic2,
  star: Star,
  headphones: Headphones,
  radio: Radio,
  disc: Disc3,
  sparkles: Sparkles,
  "graduation-cap": GraduationCap,
  calendar: CalendarDays,
  "map-pin": MapPin,
  heart: Heart,
  zap: Zap,
  target: Target,
  award: Award,
};

export function LandingIconView({ name, ...props }: { name: LandingIcon } & LucideProps) {
  const Icon = landingIcons[name] ?? Music;
  return <Icon {...props} />;
}
