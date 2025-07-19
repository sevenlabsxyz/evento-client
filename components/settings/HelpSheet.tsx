"use client";

import { Bot, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetWithDetentFull } from "@/components/ui/sheet-with-detent-full";

interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpSheet({ open, onOpenChange }: HelpSheetProps) {
  const handleExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <SheetWithDetentFull.Root
      presented={open}
      onPresentedChange={(presented) => onOpenChange(presented)}
      activeDetent={1}
      onActiveDetentChange={() => {}}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className="grid grid-rows-[min-content_1fr]">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-center mb-4">
                <SheetWithDetentFull.Handle />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Need Help?
                </h2>
                <p className="text-gray-600">
                  Choose how you'd like to get support
                </p>
              </div>
            </div>

            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className="min-h-0">
                <SheetWithDetentFull.ScrollContent className="p-4">
                  <div className="space-y-4">
                    {/* AI Agent Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            Talk to our AI agent
                          </h3>
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
                          <h3 className="font-bold text-lg">
                            Reach out to us on X
                          </h3>
                          <p className="text-gray-500 text-sm">
                            Connect with us on social media
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-black hover:bg-gray-800 text-white"
                        onClick={() =>
                          handleExternalLink("https://x.com/evento")
                        }
                      >
                        Follow @evento
                      </Button>
                    </div>

                    {/* Email Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <Mail className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            Email us at evento.so
                          </h3>
                          <p className="text-gray-500 text-sm">
                            Send us a detailed message
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-red-500 hover:bg-red-600 text-white"
                        onClick={() =>
                          handleExternalLink("mailto:hello@evento.so")
                        }
                      >
                        Send Email
                      </Button>
                    </div>
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
