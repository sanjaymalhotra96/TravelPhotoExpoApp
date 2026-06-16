export const API_CONFIG = {
  BASE_URL: 'https://api.travelphotoapp.com/v1',
  TIMEOUT: 30000,
  POLLING_INTERVAL: 3000, // 3 seconds
};

export const STORAGE_KEYS = {
  THEME_MODE: 'theme_mode',
  CUSTOM_API_URL: 'custom_api_url',
  AUTH_SESSION: 'auth_session_data',
};

export const SUPABASE_CONFIG = {
  URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock-supabase.supabase.co',
  ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-1234567890-abcdefghijklmnopqrstuvwxyz',
};

// Replicate API config for real AI face-swap generation
// Add EXPO_PUBLIC_REPLICATE_API_KEY=r8_xxx to your .env to enable real AI generation
export const REPLICATE_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_REPLICATE_API_KEY || '',
  // codeplugtech/face-swap: swaps the face from swap_image into input_image
  FACE_SWAP_MODEL: '278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34',
};

export interface TravelTemplate {
  id: string;
  name: string;
  category: 'Cities' | 'Nature' | 'Sci-Fi' | 'Vintage';
  coverUrl: string;
  description: string;
}

export const MOCK_TEMPLATES: TravelTemplate[] = [
  {
    id: 'tokyo-cyberpunk',
    name: 'Tokyo Cyberpunk',
    category: 'Sci-Fi',
    coverUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=600&auto=format&fit=crop&q=80',
    description: 'Transport yourself to the neon-lit futuristic alleys of Tokyo, Japan.',
  },
  {
    id: 'paris-vintage',
    name: 'Vintage Paris Cafe',
    category: 'Vintage',
    coverUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80',
    description: 'Relax in a cozy, timeless Parisian cafe near the Eiffel Tower.',
  },
  {
    id: 'bali-paradise',
    name: 'Bali Tropical Oasis',
    category: 'Nature',
    coverUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=80',
    description: 'Immerse in lush green rice terraces and serene tropical waterfalls in Bali.',
  },
  {
    id: 'newyork-skyline',
    name: 'New York Rooftop',
    category: 'Cities',
    coverUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format&fit=crop&q=80',
    description: 'Look over the historic Empire State Building from a Manhattan penthouse.',
  },
  {
    id: 'santorini-sunset',
    name: 'Santorini Coast',
    category: 'Nature',
    coverUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&auto=format&fit=crop&q=80',
    description: 'Enjoy white-washed domes and the deep blue Aegean sea during golden hour.',
  },
  {
    id: 'swiss-alps',
    name: 'Swiss Alpine Village',
    category: 'Nature',
    coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    description: 'Experience a snowy chalet high up in the stunning valleys of Zermatt.',
  },
];

export const MOCK_GENERATED_IMAGES: Record<string, string> = {
  'tokyo-cyberpunk': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
  'paris-vintage': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop&q=80',
  'bali-paradise': 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80',
  'newyork-skyline': 'https://images.unsplash.com/photo-1522083165195-342750297f4e?w=800&auto=format&fit=crop&q=80',
  'santorini-sunset': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80',
  'swiss-alps': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
};

export interface HistoryItem {
  id: string;
  templateId: string;
  templateName: string;
  imageUrl: string;
  created_at: string;
}

export const MOCK_HISTORY: HistoryItem[] = [
  {
    id: 'gen_1',
    templateId: 'tokyo-cyberpunk',
    templateName: 'Tokyo Cyberpunk',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
    created_at: '2026-06-12T14:30:00Z',
  },
  {
    id: 'gen_2',
    templateId: 'paris-vintage',
    templateName: 'Vintage Paris Cafe',
    imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
    created_at: '2026-06-10T09:15:00Z',
  },
];

export const CONFIG = {
  // Data APIs (templates, profile, history) always use mock data
  // — there is no real backend server for these endpoints
  USE_MOCK_API: true,

  // AI Generation: use real Replicate face-swap when key is present, otherwise demo mode
  USE_REAL_AI: !!process.env.EXPO_PUBLIC_REPLICATE_API_KEY,
};


// ── Startup diagnostic (visible in Metro console on every app launch) ─────────
if (__DEV__) {
  const replicateKey = process.env.EXPO_PUBLIC_REPLICATE_API_KEY;
  console.log('═══════════════════════════════════════════');
  console.log('🚀 Travel AI App — Startup Config');
  console.log('═══════════════════════════════════════════');
  console.log('  Supabase URL   :', process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log('  Replicate key  :', replicateKey ? `r8_****${replicateKey.slice(-4)} ✅` : '(not set) ⚠️');
  console.log('  Data APIs      : 🗂️  MOCK (templates, profile, history)');
  console.log('  AI Generation  :', CONFIG.USE_REAL_AI ? '🤖 REAL AI (Replicate face-swap)' : '🎭 DEMO mode (no key)');
  console.log('═══════════════════════════════════════════');
}


