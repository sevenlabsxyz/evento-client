"use client";

import { Button } from "@/components/ui/button";
import { SheetWithDetentFull } from "@/components/ui/sheet-with-detent-full";

interface APISheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactRequest: () => void;
}

export function APISheet({
  open,
  onOpenChange,
  onContactRequest,
}: APISheetProps) {
  const handleGetAccess = () => {
    onOpenChange(false);
    onContactRequest();
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
                  Evento API22222
                </h2>
                <p className="text-gray-600">
                  Build custom integrations with Evento
                </p>
              </div>
            </div>

            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className="min-h-0">
                <SheetWithDetentFull.ScrollContent className="p-4">
                  <div className="space-y-6">
                    {/* CTA Button */}
                    <div className="bg-white rounded-2xl p-6">
                      <Button
                        onClick={handleGetAccess}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-semibold text-lg"
                      >
                        Get API Access
                      </Button>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl p-6 space-y-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        Build Your Own Integrations
                      </h2>

                      <p className="text-gray-700 leading-relaxed">
                        With the Evento API, you can build your own native
                        integrations that allow you to fully customize the UI
                        while still providing your users, customers, friends, or
                        community access to your latest events and all the
                        information around them.
                      </p>

                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900">
                          What you can do:
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Access event data and details</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Create custom event displays</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Integrate with your existing systems</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Build custom notification systems</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Sync events across platforms</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Use Cases */}
                    <div className="bg-white rounded-2xl p-6 space-y-4">
                      <h3 className="font-semibold text-gray-900">
                        Popular Use Cases
                      </h3>

                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium text-gray-900">
                            Website Integration
                          </h4>
                          <p className="text-sm text-gray-600">
                            Display your events on your website with custom
                            styling
                          </p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-4">
                          <h4 className="font-medium text-gray-900">
                            Mobile Apps
                          </h4>
                          <p className="text-sm text-gray-600">
                            Build native mobile experiences for your events
                          </p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-4">
                          <h4 className="font-medium text-gray-900">
                            Community Platforms
                          </h4>
                          <p className="text-sm text-gray-600">
                            Integrate events into Discord, Slack, or other
                            platforms
                          </p>
                        </div>

                        <div className="border-l-4 border-red-500 pl-4">
                          <h4 className="font-medium text-gray-900">
                            Analytics & Reporting
                          </h4>
                          <p className="text-sm text-gray-600">
                            Build custom dashboards and reporting tools
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Getting Started */}
                    <div className="bg-white rounded-2xl p-6 space-y-4">
                      <h3 className="font-semibold text-gray-900">
                        Getting Started
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-red-600">
                              1
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Request Access
                            </p>
                            <p className="text-sm text-gray-600">
                              Tell us about your use case and get approved
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-red-600">
                              2
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Get Your API Keys
                            </p>
                            <p className="text-sm text-gray-600">
                              Receive your authentication credentials
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-red-600">
                              3
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Start Building
                            </p>
                            <p className="text-sm text-gray-600">
                              Use our documentation to integrate the API
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="bg-gradient-to-r from-red-500 to-red-500 rounded-2xl p-6 text-white">
                      <h3 className="font-bold text-lg mb-2">
                        Ready to get started?
                      </h3>
                      <p className="text-red-100 mb-4 text-sm">
                        Join other developers building amazing experiences with
                        the Evento API
                      </p>
                      <Button
                        onClick={handleGetAccess}
                        className="w-full bg-white text-red-600 hover:bg-gray-100 font-semibold"
                      >
                        Request API Access
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
