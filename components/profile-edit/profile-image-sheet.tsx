'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useUploadProfileImage } from '@/lib/hooks/useUserProfile';
import { toast } from '@/lib/utils/toast';
import { Camera, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

interface ProfileImageSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string;
  userName?: string;
  onImageUpdate?: (imageUrl: string) => void;
}

export default function ProfileImageSheet({
  isOpen,
  onClose,
  currentImage,
  userName = 'User',
  onImageUpdate,
}: ProfileImageSheetProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadProfileImage();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadMutation.mutateAsync(selectedFile);
      if (result?.image && onImageUpdate) {
        onImageUpdate(result.image);
      }
      toast.success('Profile image updated');
      onClose();
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleCancel()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 pb-4 pt-4">
              <SheetWithDetentFull.Handle />
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Profile Image</h2>
                <button
                  onClick={handleCancel}
                  className="rounded-full p-2 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">Choose your photo</p>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className="p-6">
                  {/* Avatar Preview */}
                  <div className="mb-8 flex flex-col items-center">
                    <Avatar className="mb-4 h-32 w-32">
                      <AvatarImage
                        src={selectedImage || currentImage || ''}
                        alt="Profile"
                      />
                      <AvatarFallback>
                        <Image
                          src="/assets/img/evento-sublogo.svg"
                          alt="Evento"
                          className="h-full w-full p-1"
                        />
                      </AvatarFallback>
                    </Avatar>

                    {/* Camera Icon Overlay */}
                    <button
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 rounded-full bg-white p-3 shadow-md transition-shadow hover:shadow-lg"
                    >
                      <Camera className="h-6 w-6 text-gray-600" />
                    </button>
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={triggerFileInput}
                    variant="outline"
                    className="mb-6 w-full"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Choose from Library
                  </Button>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Save/Cancel Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-red-500 text-white hover:bg-red-600"
                      disabled={!selectedFile || isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Save'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
