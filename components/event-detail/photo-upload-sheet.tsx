"use client";

import { Button } from "@/components/ui/button";
import { SheetWithDetentFull } from "@/components/ui/sheet-with-detent-full";
import { toast } from "@/lib/utils/toast";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useEffect } from "react";
import { useMultiFileUpload } from "@/lib/hooks/use-multi-file-upload";

interface PhotoUploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

const MAX_PHOTOS = 20;
const MAX_FILE_SIZE = 10; // MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function PhotoUploadSheet({
  isOpen,
  onClose,
  eventId,
}: PhotoUploadSheetProps) {
  const queryClient = useQueryClient();
  const inputFileRef = useRef<HTMLInputElement>(null);

  const {
    selectedFilesData,
    isUploading,
    uploadProgressIndividual,
    handleFileSelect,
    removeFileFromSelection,
    clearSelection,
    uploadFiles,
    acceptedFileTypes,
  } = useMultiFileUpload({
    onUpload: async (file: File) => {
      // Create URL parameters
      const params = new URLSearchParams({
        id: eventId,
        filename: file.name,
      });

      // Upload file directly as binary with progress monitoring
      const response = await fetch(
        `/api/v1/events/gallery/upload?${params.toString()}`,
        {
          method: "POST",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error ${response.status}`);
      }

      const result = await response.json();
      return result;
    },
    onSuccess: async () => {
      // Invalidate gallery data cache to refresh the UI
      await queryClient.invalidateQueries({
        queryKey: ["event", "gallery", eventId],
      });

      // Close sheet after successful upload
      handleClose();
    },
    maxFileSize: MAX_FILE_SIZE,
    maxFiles: MAX_PHOTOS,
    acceptedTypes: ALLOWED_TYPES,
  });

  const handleClose = () => {
    if (isUploading) {
      return; // Prevent closing during upload
    }

    clearSelection();
    onClose();
  };

  const handleUpload = async () => {
    if (selectedFilesData.length === 0) return;

    await uploadFiles();

    // Get counts from progress data
    const successCount = uploadProgressIndividual.filter(
      (p) => p.status === "success",
    ).length;
    const failCount = uploadProgressIndividual.filter(
      (p) => p.status === "failed",
    ).length;

    if (successCount > 0 && failCount === 0) {
      // All successful - close will be handled by onSuccess callback
      toast.success(
        `${successCount} photo${successCount === 1 ? "" : "s"} uploaded successfully!`,
      );
    } else if (successCount > 0 && failCount > 0) {
      // Partial success
      toast.info(`${successCount} photos uploaded, ${failCount} failed.`);
    }
  };

  // Calculate overall upload progress
  const getOverallProgress = (fileName: string): number => {
    const fileProgress = uploadProgressIndividual.find(
      (p) => p.name === fileName,
    );
    if (!fileProgress) return 0;

    if (fileProgress.status === "success") return 100;
    if (fileProgress.status === "uploading") return 50; // Show as in progress
    return 0;
  };

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented: boolean) => !presented && handleClose()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            <div className="flex h-full flex-col">
              {/* Header section - fixed at top */}
              <div className="p-6 pb-2">
                <div className="mb-4 flex justify-center"></div>

                {/* Header with close button */}
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Upload Photos
                  </h2>
                  <button
                    onClick={handleClose}
                    disabled={isUploading}
                    className="rounded-full p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Scrollable content area */}
              <div className="relative flex-1 overflow-y-auto px-6">
                {/* Photo selection area */}
                {selectedFilesData.length === 0 ? (
                  <div className="mb-6">
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                      <Camera className="mb-3 h-12 w-12 text-gray-400" />
                      <p className="mb-4 text-sm text-gray-500">
                        Select up to {MAX_PHOTOS} photos to upload to this
                        event's gallery
                      </p>
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                          Select Photos
                        </div>
                        <input
                          ref={inputFileRef}
                          id="photo-upload"
                          type="file"
                          accept={acceptedFileTypes}
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Selected photos preview */}
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700">
                        {selectedFilesData.length} photo
                        {selectedFilesData.length !== 1 && "s"} selected
                      </h3>
                      <label
                        htmlFor="photo-upload-more"
                        className="cursor-pointer text-sm text-red-600"
                      >
                        Add More
                        <input
                          id="photo-upload-more"
                          type="file"
                          accept={acceptedFileTypes}
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={
                            isUploading ||
                            selectedFilesData.length >= MAX_PHOTOS
                          }
                        />
                      </label>
                    </div>

                    {/* Photos grid */}
                    <div className="mb-52 grid h-fit max-h-fit auto-rows-max grid-cols-3 gap-3 p-1">
                      {selectedFilesData.map((fileData) => (
                        <div
                          key={fileData.file.name}
                          className="relative aspect-square"
                        >
                          <div className="absolute inset-0 overflow-hidden rounded-lg">
                            <Image
                              src={fileData.previewUrl}
                              alt="Photo preview"
                              fill
                              className="object-cover"
                            />
                          </div>

                          {isUploading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-white border-opacity-25"></div>
                              <div className="absolute text-sm font-bold text-white">
                                {getOverallProgress(fileData.file.name)}%
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                removeFileFromSelection(fileData.file.name)
                              }
                              className="absolute right-1 top-1 rounded-full bg-black bg-opacity-70 p-1.5 text-white hover:bg-opacity-90"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons - fixed at bottom */}
              <div className="fixed bottom-0 left-0 right-0 flex flex-col gap-2 border-t border-gray-100 bg-white p-6">
                {selectedFilesData.length > 0 && (
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || selectedFilesData.length === 0}
                    className="w-full"
                  >
                    {isUploading ? (
                      <span className="flex items-center">
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>
                        Uploading...
                      </span>
                    ) : (
                      "Upload Photos"
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="w-full"
                >
                  {selectedFilesData.length > 0 ? "Cancel" : "Close"}
                </Button>
              </div>
            </div>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
