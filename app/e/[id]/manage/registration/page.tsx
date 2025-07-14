'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Settings, Trash2, GripVertical } from 'lucide-react';
import { getEventById } from '@/lib/data/sample-events';

type QuestionType = 'text' | 'long-text' | 'single-select' | 'multi-select' | 'url' | 'phone' | 'checkbox' | 'instagram' | 'twitter' | 'youtube' | 'linkedin' | 'company';

interface RegistrationQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  enabled: boolean;
  options?: string[];
  order: number;
}

export default function RegistrationQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  // Get existing event data
  const existingEvent = getEventById(eventId);
  
  if (!existingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're trying to manage doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Mock registration questions data (empty for now to show empty state)
  const [questions, setQuestions] = useState<RegistrationQuestion[]>([]);

  const handleAddQuestion = () => {
    router.push(`/e/event/${eventId}/manage/registration/types`);
  };

  const handleToggleEnabled = (questionId: string) => {
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId ? { ...q, enabled: !q.enabled } : q
      )
    );
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleEditQuestion = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      router.push(`/e/event/${eventId}/manage/registration/edit/${question.type}?id=${questionId}`);
    }
  };

  const getQuestionIcon = (type: QuestionType) => {
    switch (type) {
      case 'text': return '📝';
      case 'long-text': return '📄';
      case 'single-select': return '📋';
      case 'multi-select': return '☑️';
      case 'url': return '🔗';
      case 'phone': return '📞';
      case 'checkbox': return '✅';
      case 'instagram': return '📷';
      case 'twitter': return '🐦';
      case 'youtube': return '📺';
      case 'linkedin': return '💼';
      case 'company': return '🏢';
      default: return '❓';
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'text': return 'Text';
      case 'long-text': return 'Long Text';
      case 'single-select': return 'Single Select';
      case 'multi-select': return 'Multi Select';
      case 'url': return 'URL';
      case 'phone': return 'Phone Number';
      case 'checkbox': return 'Checkbox';
      case 'instagram': return 'Instagram';
      case 'twitter': return 'X (Twitter)';
      case 'youtube': return 'YouTube';
      case 'linkedin': return 'LinkedIn';
      case 'company': return 'Company';
      default: return type;
    }
  };

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
          <h1 className="text-xl font-semibold">Registration Questions</h1>
        </div>
        <button
          onClick={handleAddQuestion}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {questions.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 mb-4">
              Guests will be asked these questions when they register for your event.
            </div>
            
            {questions.map((question, index) => (
              <div key={question.id} className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className="mt-1">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  {/* Question Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getQuestionIcon(question.type)}</span>
                      <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {getQuestionTypeLabel(question.type)}
                      </span>
                      {question.required && (
                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-1">{question.label}</h3>
                    
                    {question.options && (
                      <div className="text-sm text-gray-500">
                        Options: {question.options.join(', ')}
                      </div>
                    )}
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => handleToggleEnabled(question.id)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        question.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          question.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditQuestion(question.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Registration Questions</h3>
            <p className="text-gray-500 text-sm mb-6">
              Add questions to collect information from guests when they register for your event.
            </p>
            <button
              onClick={handleAddQuestion}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Add Question
            </button>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-2xl">
          <h4 className="font-medium text-blue-900 mb-2">Registration Questions</h4>
          <p className="text-sm text-blue-700">
            Use registration questions to collect specific information from your guests. 
            You can make questions required or optional, and organize them in any order.
          </p>
        </div>
      </div>
    </div>
  );
}