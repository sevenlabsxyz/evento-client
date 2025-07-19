"use client";

import { APISheet } from "@/components/settings/APISheet";
import { ChangelogSheet } from "@/components/settings/ChangelogSheet";
import { ContactSheet } from "@/components/settings/ContactSheet";
import { HelpSheet } from "@/components/settings/HelpSheet";
import { useRequireAuth } from "@/lib/hooks/useAuth";
import { useTopBar } from "@/lib/stores/topbar-store";
import { toast } from "@/lib/utils/toast";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Cloud,
  Code,
  DollarSign,
  Info,
  Languages,
  LifeBuoy,
  Mail,
  Scale,
  Share,
  Shield,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import packageJson from "../../../package.json";

export default function SettingsPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { setTopBar } = useTopBar();

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: "Settings",
      subtitle: "Manage your preferences",
    });

    return () => {
      setTopBar({ rightContent: null });
    };
  }, [setTopBar]);

  // Sheet states
  const [helpSheetOpen, setHelpSheetOpen] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [changelogSheetOpen, setChangelogSheetOpen] = useState(false);
  const [apiSheetOpen, setApiSheetOpen] = useState(false);
  const [showApiContactForm, setShowApiContactForm] = useState(false);

  const handleExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    const shareData = {
      title: "Evento - Travel Events App",
      text: "Check out Evento, the best way to plan and organize your travel events!",
      url: "https://evento.so",
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText("https://evento.so");
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      // If sharing fails or is cancelled, copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText("https://evento.so");
        toast.success("Link copied to clipboard!");
      } catch (clipboardError) {
        toast.error(
          "Unable to share. Please copy the link manually: evento.so"
        );
      }
    }
  };

  // Handle API access request
  const handleApiAccess = () => {
    setApiSheetOpen(false);
    setShowApiContactForm(true);
    setContactSheetOpen(true);
  };

  if (isCheckingAuth) {
    return (
      <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center pb-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-0 pt-4">
        {/* User Profile Section */}
        <div className="bg-white mx-4 rounded-2xl mb-4">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Cloud className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-500">Andre Neves</p>
                <p className="text-gray-600 text-sm">
                  andrerfneves@protonmail.com
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Languages className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Language</span>
              </div>
              <div>
                <span className="text-gray-500">English</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Bell className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Notifications</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Currency</span>
              </div>
              <div>
                <span className="text-gray-500">US Dollar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Help Center Section */}
        <div className="px-4 mb-2">
          <h2 className="text-gray-500 font-medium text-sm uppercase tracking-wide">
            HELP CENTER
          </h2>
        </div>
        <div className="bg-white mx-4 rounded-2xl mb-4">
          <div className="p-4 border-b border-gray-100">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setHelpSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <LifeBuoy className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Need help?</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-100">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setContactSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Talk to us</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-4">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setChangelogSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">App Updates</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Developer Section */}
        <div className="px-4 mb-2">
          <h2 className="text-gray-500 font-medium text-sm uppercase tracking-wide">
            DEVELOPER
          </h2>
        </div>
        <div className="bg-white mx-4 rounded-2xl mb-4">
          <div className="p-4 border-b border-gray-100">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setApiSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Code className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Evento API</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-4">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => handleExternalLink("https://docs.evento.so")}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Documentation</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="px-4 mb-2">
          <h2 className="text-gray-500 font-medium text-sm uppercase tracking-wide">
            ABOUT
          </h2>
        </div>
        <div className="bg-white mx-4 rounded-2xl mb-4">
          <div className="p-4 border-b border-gray-100">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => handleExternalLink("https://evento.so")}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Info className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">About Evento</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-100">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => handleExternalLink("https://evento.so/terms")}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Scale className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Terms of Service</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-100">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => handleExternalLink("https://evento.so/privacy")}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Privacy Policy</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-4">
            <button
              className="flex items-center justify-between w-full"
              onClick={handleShare}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Share className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Share to a Friend</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Version Info */}
        <div className="px-4 pb-6 text-center">
          <p className="text-gray-500 text-sm">
            Version: {packageJson.version}
          </p>
        </div>
      </div>

      {/* Sheet Components */}
      <HelpSheet open={helpSheetOpen} onOpenChange={setHelpSheetOpen} />
      <ContactSheet
        open={contactSheetOpen}
        onOpenChange={(open) => {
          setContactSheetOpen(open);
          if (!open) setShowApiContactForm(false);
        }}
        prefilledTitle={showApiContactForm ? "Get Evento API access" : ""}
        prefilledMessage={
          showApiContactForm
            ? "I would like to request access to the Evento API.\n\nWhat I plan to use it for:\n\n[Please describe your use case and why you need API access]"
            : ""
        }
      />
      <ChangelogSheet
        open={changelogSheetOpen}
        onOpenChange={setChangelogSheetOpen}
      />
      <APISheet
        open={apiSheetOpen}
        onOpenChange={setApiSheetOpen}
        onContactRequest={handleApiAccess}
      />
    </div>
  );
}
