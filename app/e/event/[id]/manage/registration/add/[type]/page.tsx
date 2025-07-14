'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Type, FileText, List, CheckSquare, Link, Phone, Square, Instagram, Twitter, Youtube, Linkedin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

type QuestionType = 'text' | 'long-text' | 'single-select' | 'multi-select' | 'url' | 'phone' | 'checkbox' | 'instagram' | 'twitter' | 'youtube' | 'linkedin' | 'company';

interface QuestionConfig {
  type: QuestionType;
  label: string;
  description: string;
  defaultQuestion: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  hasOptions?: boolean;
  autoNote?: string;
}

export default function AddQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const questionType = params.type as QuestionType;

  const [questionLabel, setQuestionLabel] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(['']);

  const questionConfigs: Record<QuestionType, QuestionConfig> = {
    'text': {
      type: 'text',
      label: 'Text',
      description: 'Collect a short, single-line answer',
      defaultQuestion: '',
      icon: <Type className="w-6 h-6" />,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    'long-text': {
      type: 'long-text',
      label: 'Long Text',
      description: 'Collect a longer, multi-line answer',
      defaultQuestion: '',
      icon: <FileText className="w-6 h-6" />,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    'single-select': {
      type: 'single-select',
      label: 'Single Select',
      description: 'Let guests choose one option from a list',
      defaultQuestion: '',
      icon: <List className="w-6 h-6" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      hasOptions: true,
    },
    'multi-select': {
      type: 'multi-select',
      label: 'Multi Select',
      description: 'Let guests choose multiple options from a list',
      defaultQuestion: '',
      icon: <CheckSquare className="w-6 h-6" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      hasOptions: true,
    },
    'url': {
      type: 'url',
      label: 'URL',
      description: 'Collect a website or link',
      defaultQuestion: '',
      icon: <Link className="w-6 h-6" />,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    'phone': {
      type: 'phone',
      label: 'Phone Number',
      description: 'Collect a phone number',
      defaultQuestion: 'What is your phone number?',
      icon: <Phone className="w-6 h-6" />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    'checkbox': {
      type: 'checkbox',
      label: 'Checkbox',
      description: 'Get a yes/no or agree/disagree response',
      defaultQuestion: '',
      icon: <Square className="w-6 h-6" />,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    'instagram': {
      type: 'instagram',
      label: 'Instagram',
      description: "Get the guest's Instagram username",
      defaultQuestion: 'What is your Instagram profile?',
      icon: <Instagram className="w-6 h-6" />,
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
    'twitter': {
      type: 'twitter',
      label: 'X (Twitter)',
      description: "Get the guest's X (Twitter) handle",
      defaultQuestion: 'What is your X (Twitter) handle?',
      icon: <Twitter className="w-6 h-6" />,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
    'youtube': {
      type: 'youtube',
      label: 'YouTube',
      description: "Get the guest's YouTube channel",
      defaultQuestion: 'What is your YouTube channel?',
      icon: <Youtube className="w-6 h-6" />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    'linkedin': {
      type: 'linkedin',
      label: 'LinkedIn',
      description: "Get the guest's LinkedIn profile",
      defaultQuestion: 'What is your LinkedIn profile?',
      icon: <Linkedin className="w-6 h-6" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    'company': {
      type: 'company',
      label: 'Company',
      description: 'Get the company the guest works for',
      defaultQuestion: 'What company do you work for?',
      icon: <Building className="w-6 h-6" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      autoNote: "We'll automatically pull this information if they've entered it on Luma before.",
    },
  };

  const config = questionConfigs[questionType];

  useEffect(() => {
    if (config?.defaultQuestion) {
      setQuestionLabel(config.defaultQuestion);
    }
  }, [config]);

  const handleSave = () => {
    console.log('Saving question:', {
      type: questionType,
      label: questionLabel,
      required: isRequired,
      options: config?.hasOptions ? options.filter(o => o.trim()) : undefined,
    });
    
    // In a real app, you would save this to your backend
    // For now, navigate back to the registration questions page
    router.push(`/e/event/${eventId}/manage/registration`);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const isFormValid = questionLabel.trim() !== '' && 
    (!config?.hasOptions || options.some(o => o.trim() !== ''));

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Question Type</h1>
          <p className="text-gray-600 mb-4">The question type you're trying to add doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Add Question</h1>
        </div>
        <Button
          onClick={handleSave}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            isFormValid
              ? "bg-black hover:bg-gray-800 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isFormValid}
        >
          Save
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Question Type Header */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${config.iconBg} rounded-xl flex items-center justify-center`}>
            <div className={config.iconColor}>
              {config.icon}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{config.label}</h2>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        </div>

        {/* Question Label Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Question Label
          </label>
          <input
            type="text"
            value={questionLabel}
            onChange={(e) => setQuestionLabel(e.target.value)}
            placeholder="Enter your question"
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Auto Note for social profiles and company */}
        {config.autoNote && (
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-700">{config.autoNote}</p>
          </div>
        )}

        {/* Options for select types */}
        {config.hasOptions && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Options
            </label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {options.length > 1 && (
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddOption}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
            >
              + Add Option
            </button>
          </div>
        )}

        {/* Required Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <h3 className="font-medium text-gray-900">Required</h3>
            <p className="text-sm text-gray-500">Guests must answer this question to register</p>
          </div>
          <button
            onClick={() => setIsRequired(!isRequired)}
            className={`w-12 h-6 rounded-full transition-colors ${
              isRequired ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform ${
                isRequired ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}