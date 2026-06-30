import {
  Camera,
  Image,
  RefreshCw,
  Share2,
  Download,
  Settings,
  ArrowLeft,
  Check,
  AlertTriangle,
  Info,
  ChevronRight,
  Sun,
  Moon,
  Trash2,
  Grid,
  Sparkles,
  User,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Bell,
  LockKeyhole,
  FileText,
  UserX,
  History,
} from 'lucide-react-native';

export const COLORS = {
  primary: '#8b5cf6', // Indigo-500
  primaryHover: '#7c3aed',
  secondary: '#ff1f75',
  accent: '#ff1f75',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  white: '#ffffff',
  black: '#000000',
  google: '#ea4335',
  
  // Default values
  background: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',

  // Light Mode Tokens
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
  },
  
  // Dark Mode Tokens
  dark: {
    background: '#0f0f15',
    card: '#191924',
    border: '#282838',
    text: '#f3f4f6',
    textMuted: '#9ca3af',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const TYPOGRAPHY = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    huge: 36,
  },
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '900' as const,
  },
};

export const BORDER_RADIUS = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
};

// Centralized icon map using Lucide
export const Icons = {
  Camera,
  Image,
  Refresh: RefreshCw,
  Share: Share2,
  Download,
  Settings,
  Back: ArrowLeft,
  Check,
  Warning: AlertTriangle,
  Info,
  ChevronRight,
  Sun,
  Moon,
  Trash: Trash2,
  Grid,
  Sparkles,
  User,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Privacy: LockKeyhole,
  Terms: FileText,
  DeleteAccount: UserX,
  History,
};
