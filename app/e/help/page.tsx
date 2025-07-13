"use client";

import { Bot, Twitter, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useRouter } from "next/navigation";

export default function HelpPage() {
  const router = useRouter();

  const handleExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200">
        <PageHeader
          title="Need Help?"
          subtitle="Choose how you'd like to get support"
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
      <div className="flex-1 px-4 py-6 space-y-4 bg-gray-50 overflow-y-auto">
        {/* AI Agent Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Talk to our AI agent</h3>
              <p className="text-gray-500 text-sm">
                Get instant answers to common questions
              </p>
            </div>
          </div>
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            Start Chat
          </Button>
        </div>

        {/* Twitter Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <Twitter className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Reach out to us on X</h3>
              <p className="text-gray-500 text-sm">
                Connect with us on social media
              </p>
            </div>
          </div>
          <Button
            className="w-full bg-black hover:bg-gray-800 text-white"
            onClick={() => handleExternalLink("https://x.com/evento")}
          >
            Follow @evento
          </Button>
        </div>

        {/* Email Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Email us at evento.so</h3>
              <p className="text-gray-500 text-sm">
                Send us a detailed message
              </p>
            </div>
          </div>
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => handleExternalLink("mailto:hello@evento.so")}
          >
            Send Email
          </Button>
        </div>
      </div>
    </div>
  );
}
