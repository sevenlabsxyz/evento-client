"use client";

import {
  LifeBuoy,
  Mail,
  Sparkles,
  Info,
  Scale,
  Shield,
  Share,
  Bell,
  Languages,
  Cloud,
  DollarSign,
  ChevronRight,
  X,
  Code,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ReusableDropdown } from "@/components/reusable-dropdown";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import packageJson from "../../../package.json";

export default function SettingsPage() {
  const router = useRouter();

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
          "Unable to share. Please copy the link manually: evento.so"
        );
      }
    }
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200">
        <PageHeader
          title="Settings"
          subtitle="Manage your app preferences"
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
            <ReusableDropdown
              trigger={
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
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
            <ReusableDropdown
              trigger={
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
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
        <div className="px-4 mb-2">
          <h2 className="text-gray-500 font-medium text-sm uppercase tracking-wide">
            HELP CENTER
          </h2>
        </div>
        <div className="bg-white mx-4 rounded-2xl mb-4">
          <div className="p-4 border-b border-gray-100">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => router.push("/e/help")}
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
              onClick={() => router.push("/e/contact")}
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
              onClick={() => router.push("/e/changelog")}
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
              onClick={() => router.push("/e/api")}
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
    </div>
  );
}
