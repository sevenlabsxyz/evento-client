"use client";

import { ReusableDropdown } from "@/components/reusable-dropdown";
import { APISheet } from "@/components/settings/APISheet";
import { ChangelogSheet } from "@/components/settings/ChangelogSheet";
import { ContactSheet } from "@/components/settings/ContactSheet";
import { HelpSheet } from "@/components/settings/HelpSheet";
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import packageJson from "../../../package.json";

export default function SettingsPage() {
  const router = useRouter();
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

  const languageItems = [
    {
      label: "English",
      value: "en",
      action: () => console.log("English selected"),
    },
    {
      label: "Spanish",
      value: "es",
      action: () => console.log("Spanish selected"),
    },
    {
      label: "French",
      value: "fr",
      action: () => console.log("French selected"),
    },
    {
      label: "German",
      value: "de",
      action: () => console.log("German selected"),
    },
    {
      label: "Italian",
      value: "it",
      action: () => console.log("Italian selected"),
    },
    {
      label: "Portuguese",
      value: "pt",
      action: () => console.log("Portuguese selected"),
    },
    {
      label: "Japanese",
      value: "ja",
      action: () => console.log("Japanese selected"),
    },
    {
      label: "Korean",
      value: "ko",
      action: () => console.log("Korean selected"),
    },
    {
      label: "Chinese",
      value: "zh",
      action: () => console.log("Chinese selected"),
    },
  ];

  const currencyItems = [
    {
      label: "US Dollar (USD)",
      value: "usd",
      action: () => console.log("USD selected"),
    },
    {
      label: "Euro (EUR)",
      value: "eur",
      action: () => console.log("EUR selected"),
    },
    {
      label: "British Pound (GBP)",
      value: "gbp",
      action: () => console.log("GBP selected"),
    },
    {
      label: "Japanese Yen (JPY)",
      value: "jpy",
      action: () => console.log("JPY selected"),
    },
    {
      label: "Canadian Dollar (CAD)",
      value: "cad",
      action: () => console.log("CAD selected"),
    },
    {
      label: "Australian Dollar (AUD)",
      value: "aud",
      action: () => console.log("AUD selected"),
    },
    {
      label: "Swiss Franc (CHF)",
      value: "chf",
      action: () => console.log("CHF selected"),
    },
    {
      label: "Chinese Yuan (CNY)",
      value: "cny",
      action: () => console.log("CNY selected"),
    },
  ];

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
          "Unable to share. Please copy the link manually: evento.so",
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

  return (
    <div className="mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm">
      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-0 pt-4">
        {/* User Profile Section */}
        <div className="mx-4 mb-4 rounded-2xl bg-white">
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <Cloud className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-500">Andre Neves</p>
                <p className="text-sm text-gray-600">
                  andrerfneves@protonmail.com
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 p-4">
            <ReusableDropdown
              trigger={
                <div className="flex cursor-pointer items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                      <Languages className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-medium">Language</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">English</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              }
              items={languageItems}
              width="w-56"
            />
          </div>

          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Bell className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Notifications</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="p-4">
            <ReusableDropdown
              trigger={
                <div className="flex cursor-pointer items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                      <DollarSign className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-medium">Currency</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">US Dollar</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              }
              items={currencyItems}
              width="w-64"
            />
          </div>
        </div>

        {/* Help Center Section */}
        <div className="mb-2 px-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            HELP CENTER
          </h2>
        </div>
        <div className="mx-4 mb-4 rounded-2xl bg-white">
          <div className="border-b border-gray-100 p-4">
            <button
              className="flex w-full items-center justify-between"
              onClick={() => setHelpSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <LifeBuoy className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Need help?</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="border-b border-gray-100 p-4">
            <button
              className="flex w-full items-center justify-between"
              onClick={() => setContactSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Mail className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Talk to us</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-4">
            <button
              className="flex w-full items-center justify-between"
              onClick={() => setChangelogSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Sparkles className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">App Updates</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Developer Section */}
        <div className="mb-2 px-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            DEVELOPER
          </h2>
        </div>
        <div className="mx-4 mb-4 rounded-2xl bg-white">
          <div className="border-b border-gray-100 p-4">
            <button
              className="flex w-full items-center justify-between"
              onClick={() => setApiSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Code className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Evento API</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-4">
            <button
              className="flex w-full items-center justify-between"
              onClick={() => handleExternalLink("https://docs.evento.so")}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <BookOpen className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Documentation</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="mb-2 px-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            ABOUT
          </h2>
        </div>
        <div className="mx-4 mb-4 rounded-2xl bg-white">
          <div className="border-b border-gray-100 p-4">
            <button
              className="flex w-full items-center justify-between"
              onClick={() => handleExternalLink("https://evento.so")}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Info className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">About Evento</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="border-b border-gray-100 p-4">
            <button
              className="flex w-full items-center justify-between"
              onClick={() => handleExternalLink("https://evento.so/terms")}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Scale className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Terms of Service</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="border-b border-gray-100 p-4">
            <button
              className="flex w-full items-center justify-between"
              onClick={() => handleExternalLink("https://evento.so/privacy")}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Privacy Policy</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-4">
            <button
              className="flex w-full items-center justify-between"
              onClick={handleShare}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
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
          <p className="text-sm text-gray-500">
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
