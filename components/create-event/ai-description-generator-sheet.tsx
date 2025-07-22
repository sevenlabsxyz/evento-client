'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import {
  GenerateDescriptionParams,
  useGenerateDescription,
} from '@/lib/hooks/useGenerateDescription';
import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/core';
import {
  BrainCircuit,
  CheckCircle,
  Loader2,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
// Import local loading dots component directly with relative path
import { LoadingDots } from '../ui/loading-dots';

// Define event object structure to match API requirements
export interface EventData {
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  visibility?: string;
  spotifyUrl?: string;
  cost?: string | number;
  currentDescription?: string;
}

interface AIDescriptionGeneratorSheetProps {
  event: EventData;
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
}

// Define tone options
const toneOptions = [
  {
    value: 'professional',
    label: 'Professional',
    icon: <BrainCircuit className="h-4 w-4" />,
    description: 'Formal and polished',
  },
  {
    value: 'casual',
    label: 'Casual',
    icon: <MessageCircle className="h-4 w-4" />,
    description: 'Relaxed and friendly',
  },
  {
    value: 'exciting',
    label: 'Exciting',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Energetic and enthusiastic',
  },
];

// Define length options
const lengthOptions = [
  { value: 'short', label: 'Short', description: '2-3 sentences' },
  { value: 'medium', label: 'Medium', description: '4-6 sentences' },
  { value: 'long', label: 'Long', description: '7-10 sentences' },
];

export function AIDescriptionGeneratorSheet({
  event,
  isOpen,
  onClose,
  editor,
}: AIDescriptionGeneratorSheetProps) {
  // State for selected options
  const [selectedLength, setSelectedLength] = useState('short');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateDescriptionMutation = useGenerateDescription();

  // Check if event has a title
  const hasTitleField = Boolean(event?.title);

  const generateDescription = async () => {
    try {
      // Clear previous errors and content
      setError(null);
      setGeneratedContent(null);

      // Get current description from editor to pass as context
      const currentDescription = editor.getHTML();

      // Prepare API parameters
      const params: GenerateDescriptionParams = {
        // Required event data
        title: event.title,

        // Optional event data
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: event.timezone,
        visibility: event.visibility,
        spotifyUrl: event.spotifyUrl,
        cost: event.cost,
        currentDescription: currentDescription || undefined,

        // AI generation options
        length: selectedLength as 'short' | 'medium' | 'long',
        tone: selectedTone as 'professional' | 'casual' | 'exciting',
        customPrompt: customPrompt.trim() || undefined,
        eventContext: getEventContext(),
        userPrompt: customPrompt.trim() || undefined,
      };

      // Call the API through our hook
      const result = await generateDescriptionMutation.mutateAsync(params);
      console.log('GENERATED DESCRIPTION', result.description);

      // Set the generated content from the API response
      setGeneratedContent(result.description);
    } catch (err) {
      console.error('Error generating description:', err);
      setError('Failed to generate description. Please try again.');
    }
  };

  // Extract relevant event context from the editor to help the AI
  const getEventContext = () => {
    // Get the current content as text for context
    const content = editor.getText();
    return content.length > 0 ? content : undefined;
  };

  const insertGeneratedContent = () => {
    if (generatedContent) {
      // Insert the content at the current cursor position
      editor.chain().focus().insertContent(generatedContent).run();
      onClose();
    }
  };

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className="relative">
            {/* Fixed Header */}
            <div className="border-b border-gray-200">
              <div className="mb-4 flex justify-center">
                <SheetWithDetentFull.Handle className="h-1 w-12 bg-gray-300 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-4 pb-4">
                <button
                  onClick={onClose}
                  className="text-red-600 hover:text-red-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <h1 className="text-lg font-semibold text-gray-900">
                  AI Description
                </h1>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors opacity-0"
                >
                  Cancel
                </button>
              </div>

              {/* Title Warning */}
              {!hasTitleField && (
                <div className="bg-amber-50 px-4 py-2 text-sm text-amber-600 flex items-center gap-1">
                  <p>
                    Please add an event title before generating a description
                  </p>
                </div>
              )}

              {/* Toolbar */}
              <div className="bg-gray-50 px-4 py-2">
                <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">
                      AI-powered description generator
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading overlay */}
            {generateDescriptionMutation.isPending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 p-4 text-center z-10">
                <LoadingDots size="lg" className="mb-4 text-red-600" />
                <p className="text-sm text-gray-600">
                  Creating the perfect description for your event...
                </p>
              </div>
            )}

            {/* Scrollable Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent>
                  <div className="px-4 py-4">
                    {!generatedContent ? (
                      <>
                        {/* Description Length Selection */}
                        <div className="mb-6">
                          <h2 className="text-base font-medium mb-2">
                            Description Length
                          </h2>
                          <div className="grid grid-cols-3 gap-3">
                            {lengthOptions.map((option) => (
                              <button
                                key={option.value}
                                className={cn(
                                  'flex flex-col items-center justify-center py-3 px-2 border rounded-md transition-all',
                                  selectedLength === option.value
                                    ? 'border-red-600 bg-red-50 text-red-600'
                                    : 'border-gray-200 hover:border-gray-300'
                                )}
                                onClick={() => setSelectedLength(option.value)}
                                disabled={
                                  generateDescriptionMutation.isPending ||
                                  !hasTitleField
                                }
                              >
                                <span className="font-medium">
                                  {option.label}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  {option.description}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tone Selection */}
                        <div className="mb-6">
                          <h2 className="text-base font-medium mb-2">
                            Tone & Style
                          </h2>
                          <div className="grid grid-cols-3 gap-3">
                            {toneOptions.map((option) => (
                              <button
                                key={option.value}
                                className={cn(
                                  'flex flex-col items-center justify-center py-3 px-2 border rounded-md transition-all',
                                  selectedTone === option.value
                                    ? 'border-red-600 bg-red-50 text-red-600'
                                    : 'border-gray-200 hover:border-gray-300'
                                )}
                                onClick={() => setSelectedTone(option.value)}
                                disabled={
                                  generateDescriptionMutation.isPending ||
                                  !hasTitleField
                                }
                              >
                                <div className="mb-1">{option.icon}</div>
                                <span className="font-medium">
                                  {option.label}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  {option.description}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Prompt */}
                        <div className="mb-6">
                          <h2 className="text-base font-medium mb-2">
                            Custom Prompt (Optional)
                          </h2>
                          <p className="text-sm text-gray-500 mb-2">
                            Add specific details you'd like to include in your
                            description
                          </p>
                          <textarea
                            className={cn(
                              'w-full p-3 border rounded-md resize-none transition-colors',
                              !hasTitleField
                                ? 'border-gray-200 bg-gray-50 text-gray-400'
                                : 'border-gray-200 focus:border-red-600 focus:ring focus:ring-red-100 focus:ring-opacity-50'
                            )}
                            placeholder="e.g. Include information about food, dress code, or parking..."
                            rows={3}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            disabled={
                              generateDescriptionMutation.isPending ||
                              !hasTitleField
                            }
                          />
                        </div>

                        {/* Generate Button */}
                        <div className="mt-6">
                          <Button
                            onClick={generateDescription}
                            disabled={
                              generateDescriptionMutation.isPending ||
                              !hasTitleField
                            }
                            className={cn(
                              'w-full font-medium py-2 transition-colors',
                              !hasTitleField
                                ? 'bg-red-300 text-white cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            )}
                          >
                            {generateDescriptionMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Description
                              </>
                            )}
                          </Button>

                          {!hasTitleField && (
                            <p className="mt-2 text-center text-sm text-gray-500">
                              Add an event title to enable description
                              generation
                            </p>
                          )}
                        </div>

                        {/* Error Message */}
                        {error && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {error}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Generated Content Display */}
                        <div className="mb-5">
                          <div className="flex items-center gap-2 mb-3 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium text-base">
                              Description Generated!
                            </span>
                          </div>
                          <div className="p-4 border border-gray-200 rounded-md bg-white prose prose-sm max-w-none">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: generatedContent || '',
                              }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setGeneratedContent(null);
                              setError(null);
                            }}
                            className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                          >
                            Edit Options
                          </Button>
                          <Button
                            onClick={insertGeneratedContent}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            Use This Description
                          </Button>
                        </div>
                      </>
                    )}
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
