import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UserDetails } from '@/lib/types/api';

interface ProfileFormState {
  // Profile fields matching API
  username: string;
  name: string;
  bio: string;
  image: string;
  bio_link: string;
  x_handle: string;
  instagram_handle: string;
  ln_address: string;
  nip05: string;
  
  // Original values for change detection
  originalData: Partial<UserDetails> | null;
  
  // Actions
  setUsername: (username: string) => void;
  setName: (name: string) => void;
  setBio: (bio: string) => void;
  setImage: (image: string) => void;
  setBioLink: (bio_link: string) => void;
  setXHandle: (x_handle: string) => void;
  setInstagramHandle: (instagram_handle: string) => void;
  setLnAddress: (ln_address: string) => void;
  setNip05: (nip05: string) => void;
  
  // Populate from API data
  populateFromUser: (user: UserDetails) => void;
  
  // Get form data for API submission
  getFormData: () => Partial<UserDetails>;
  
  // Validation
  isValid: () => boolean;
  hasChanges: () => boolean;
  
  // Reset
  reset: () => void;
}

const initialState = {
  username: '',
  name: '',
  bio: '',
  image: '',
  bio_link: '',
  x_handle: '',
  instagram_handle: '',
  ln_address: '',
  nip05: '',
  originalData: null,
};

export const useProfileFormStore = create<ProfileFormState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Setters
      setUsername: (username) => set({ username }),
      setName: (name) => set({ name }),
      setBio: (bio) => set({ bio }),
      setImage: (image) => set({ image }),
      setBioLink: (bio_link) => set({ bio_link }),
      setXHandle: (x_handle) => set({ x_handle }),
      setInstagramHandle: (instagram_handle) => set({ instagram_handle }),
      setLnAddress: (ln_address) => set({ ln_address }),
      setNip05: (nip05) => set({ nip05 }),
      
      // Populate from user data
      populateFromUser: (user) => {
        set({
          username: user.username || '',
          name: user.name || '',
          bio: user.bio || '',
          image: user.image || '',
          bio_link: user.bio_link || '',
          x_handle: user.x_handle || '',
          instagram_handle: user.instagram_handle || '',
          ln_address: user.ln_address || '',
          nip05: user.nip05 || '',
          originalData: {
            username: user.username,
            name: user.name,
            bio: user.bio,
            image: user.image,
            bio_link: user.bio_link,
            x_handle: user.x_handle,
            instagram_handle: user.instagram_handle,
            ln_address: user.ln_address,
            nip05: user.nip05,
          },
        });
      },
      
      // Get form data for API
      getFormData: () => {
        const state = get();
        const formData: Partial<UserDetails> = {};
        
        // Only include changed fields
        if (state.username !== state.originalData?.username) {
          formData.username = state.username;
        }
        if (state.name !== state.originalData?.name) {
          formData.name = state.name;
        }
        if (state.bio !== state.originalData?.bio) {
          formData.bio = state.bio;
        }
        if (state.image !== state.originalData?.image) {
          formData.image = state.image;
        }
        if (state.bio_link !== state.originalData?.bio_link) {
          formData.bio_link = state.bio_link;
        }
        if (state.x_handle !== state.originalData?.x_handle) {
          formData.x_handle = state.x_handle;
        }
        if (state.instagram_handle !== state.originalData?.instagram_handle) {
          formData.instagram_handle = state.instagram_handle;
        }
        if (state.ln_address !== state.originalData?.ln_address) {
          formData.ln_address = state.ln_address;
        }
        if (state.nip05 !== state.originalData?.nip05) {
          formData.nip05 = state.nip05;
        }
        
        return formData;
      },
      
      // Validation
      isValid: () => {
        const state = get();
        // Required fields: username and name
        return state.username.trim().length >= 3 && state.name.trim().length > 0;
      },
      
      // Check if there are changes
      hasChanges: () => {
        const state = get();
        if (!state.originalData) return false;
        
        return (
          state.username !== state.originalData.username ||
          state.name !== state.originalData.name ||
          state.bio !== state.originalData.bio ||
          state.image !== state.originalData.image ||
          state.bio_link !== state.originalData.bio_link ||
          state.x_handle !== state.originalData.x_handle ||
          state.instagram_handle !== state.originalData.instagram_handle ||
          state.ln_address !== state.originalData.ln_address ||
          state.nip05 !== state.originalData.nip05
        );
      },
      
      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'profile-form-store',
    }
  )
);