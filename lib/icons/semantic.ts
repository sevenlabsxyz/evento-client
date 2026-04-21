import type { AppIconComponent } from '@/lib/icons';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Bitcoin,
  BitcoinEllipseIcon,
  BookOpen,
  Calendar,
  Calendar1,
  CheckCheck,
  CheckCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Shirt,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  User,
  UserCircle,
  Wallet,
  Zap,
} from '@/lib/icons';

export const navigationIcons = {
  events: Calendar1,
  wallet: BitcoinEllipseIcon,
  create: Plus,
  search: Search,
  messages: MessageCircle,
  lists: Star,
  profile: UserCircle,
  settings: Settings,
  blog: BookOpen,
  store: Shirt,
} satisfies Record<string, AppIconComponent>;

export const walletActionIcons = {
  buySell: Bitcoin,
  spend: ShoppingCart,
  earn: Star,
  converter: ArrowRightLeft,
  help: HelpCircle,
  wallet: Wallet,
  lightning: Zap,
} satisfies Record<string, AppIconComponent>;

export const notificationIcons = {
  read: CheckCheck,
  archive: Trash2,
  eventInvite: Star,
  eventComment: MessageCircle,
  eventRsvp: Clock,
  userFollow: User,
  default: Clock,
} satisfies Record<string, AppIconComponent>;

export const onboardingIcons = {
  previous: ArrowLeft,
  next: ArrowRight,
  discover: Calendar,
  wallet: Zap,
  connect: Sparkles,
} satisfies Record<string, AppIconComponent>;

export const statusIcons = {
  success: CheckCircle,
  successAlt: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  pending: Clock,
} satisfies Record<string, AppIconComponent>;
