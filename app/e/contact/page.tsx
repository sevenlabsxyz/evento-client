"use client";

import type React from "react";

import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useRouter, useSearchParams } from "next/navigation"; // keep useSearchParams for initial read
import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const router = useRouter();
  const prefilledTitle = useSearchParams().get("title") ?? "";
  const prefilledMessage = useSearchParams().get("message") ?? "";

  const [formData, setFormData] = useState({
    title: prefilledTitle,
    message: prefilledMessage,
  });
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate random success/failure
      const success = Math.random() > 0.2; // 80% success rate

      if (success) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        router.push("/settings");
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
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200">
        <PageHeader
          title="Contact Us"
          subtitle="Send us a message and we'll get back to you"
          rightContent={
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-100"
              onClick={() => router.back()}
            >
              <X className="h-5 w-5" />
            </Button>
          }
        />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 px-4 py-6 space-y-6 bg-gray-50 overflow-y-auto"
      >
        {/* Title Field */}
        <div className="bg-white rounded-2xl p-4 space-y-2">
          <label className="text-sm font-medium text-gray-700">Subject *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="What's this about?"
            className="w-full text-gray-900 font-medium bg-transparent border-none outline-none text-lg"
            required
          />
        </div>

        {/* Message Field */}
        <div className="bg-white rounded-2xl p-4 space-y-2">
          <label className="text-sm font-medium text-gray-700">Message *</label>
          <textarea
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            placeholder="Tell us more about your issue or question..."
            rows={6}
            className="w-full text-gray-900 bg-transparent border-none outline-none resize-none"
            required
          />
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-2xl p-4 space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Attachment (optional)
          </label>

          {attachedFile ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Upload className="h-4 w-4 text-orange-600" />
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
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 transition-colors">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload a file or screenshot
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </div>
            ) : (
              "Send Message"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
