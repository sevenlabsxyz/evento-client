"use client";

import { Button } from "@/components/ui/button";
import { SheetWithDetent } from "@/components/ui/sheet-with-detent";
import { toast } from "@/lib/utils/toast";
import { Upload, X } from "lucide-react";
import React, { useState } from "react";

interface ContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledTitle?: string;
  prefilledMessage?: string;
}

export function ContactSheet({
  open,
  onOpenChange,
  prefilledTitle = "",
  prefilledMessage = "",
}: ContactSheetProps) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });

  // Update form when prefilled values change
  React.useEffect(() => {
    if (open && (prefilledTitle || prefilledMessage)) {
      setFormData({
        title: prefilledTitle,
        message: prefilledMessage,
      });
    } else if (!open) {
      setFormData({ title: "", message: "" });
    }
  }, [open, prefilledTitle, prefilledMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const success = Math.random() > 0.2;

      if (success) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        onOpenChange(false);
        setFormData({ title: "", message: "" });
        setAttachedFile(null);
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SheetWithDetent.Root
      presented={open}
      onPresentedChange={(presented) => onOpenChange(presented)}
      activeDetent={1}
      onActiveDetentChange={() => {}}
    >
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content className="grid grid-rows-[min-content_1fr]">
            <div className="border-b border-gray-100 p-4">
              <div className="mb-4 flex justify-center">
                <SheetWithDetent.Handle />
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Contact Us
                </h2>
                <p className="text-gray-600">
                  Send us a message and we'll get back to you
                </p>
              </div>
            </div>

            <SheetWithDetent.ScrollRoot asChild>
              <SheetWithDetent.ScrollView className="min-h-0">
                <SheetWithDetent.ScrollContent className="p-4">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title Field */}
                    <div className="space-y-2 rounded-2xl bg-white p-4">
                      <label className="text-sm font-medium text-gray-700">
                        Subject *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="What's this about?"
                        className="w-full border-none bg-transparent text-lg font-medium text-gray-900 outline-none"
                        required
                      />
                    </div>

                    {/* Message Field */}
                    <div className="space-y-2 rounded-2xl bg-white p-4">
                      <label className="text-sm font-medium text-gray-700">
                        Message *
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Tell us more about your issue or question..."
                        rows={6}
                        className="w-full resize-none border-none bg-transparent text-gray-900 outline-none"
                        required
                      />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2 rounded-2xl bg-white p-4">
                      <label className="text-sm font-medium text-gray-700">
                        Attachment (optional)
                      </label>

                      {attachedFile ? (
                        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                              <Upload className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {attachedFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(attachedFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={removeFile}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-red-500">
                            <div className="text-center">
                              <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                              <p className="text-sm text-gray-600">
                                Click to upload a file or screenshot
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                PNG, JPG, PDF, DOC up to 10MB
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-red-500 py-3 font-medium text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                            Sending...
                          </div>
                        ) : (
                          "Send Message"
                        )}
                      </Button>
                    </div>
                  </form>
                </SheetWithDetent.ScrollContent>
              </SheetWithDetent.ScrollView>
            </SheetWithDetent.ScrollRoot>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
