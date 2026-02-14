'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateRegistrationQuestion } from '@/lib/hooks/use-create-registration-question';
import { useDeleteRegistrationQuestion } from '@/lib/hooks/use-delete-registration-question';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useRegistrationQuestions } from '@/lib/hooks/use-registration-questions';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useReorderRegistrationQuestions } from '@/lib/hooks/use-reorder-registration-questions';
import { useUpdateRegistrationQuestion } from '@/lib/hooks/use-update-registration-question';
import { useUpdateRegistrationSettings } from '@/lib/hooks/use-update-registration-settings';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { RegistrationQuestion, RegistrationQuestionType } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Building,
  CheckSquare,
  ClipboardList,
  FileText,
  GripVertical,
  Instagram,
  Link,
  Linkedin,
  List,
  Loader2,
  MoreHorizontal,
  Phone,
  Plus,
  Settings,
  Square,
  Trash2,
  Twitter,
  Type,
  Youtube,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface QuestionTypeOption {
  key: RegistrationQuestionType;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

interface QuestionConfig {
  type: RegistrationQuestionType;
  label: string;
  description: string;
  defaultQuestion: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  hasOptions?: boolean;
  autoNote?: string;
}

const basicQuestions: QuestionTypeOption[] = [
  {
    key: 'text',
    label: 'Text',
    icon: <Type className='h-6 w-6' />,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    key: 'long_text',
    label: 'Long Text',
    icon: <FileText className='h-6 w-6' />,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    key: 'single_select',
    label: 'Single Select',
    icon: <List className='h-6 w-6' />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    key: 'multi_select',
    label: 'Multi Select',
    icon: <CheckSquare className='h-6 w-6' />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    key: 'url',
    label: 'URL',
    icon: <Link className='h-6 w-6' />,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    key: 'phone',
    label: 'Phone Number',
    icon: <Phone className='h-6 w-6' />,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    key: 'checkbox',
    label: 'Checkbox',
    icon: <Square className='h-6 w-6' />,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
];

const socialProfileQuestions: QuestionTypeOption[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: <Instagram className='h-6 w-6' />,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    icon: <Twitter className='h-6 w-6' />,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: <Youtube className='h-6 w-6' />,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: <Linkedin className='h-6 w-6' />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
];

const otherQuestions: QuestionTypeOption[] = [
  {
    key: 'company',
    label: 'Company',
    icon: <Building className='h-6 w-6' />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
];

const questionConfigs: Record<RegistrationQuestionType, QuestionConfig> = {
  text: {
    type: 'text',
    label: 'Text',
    description: 'Collect a short, single-line answer',
    defaultQuestion: '',
    icon: <Type className='h-6 w-6' />,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  long_text: {
    type: 'long_text',
    label: 'Long Text',
    description: 'Collect a longer, multi-line answer',
    defaultQuestion: '',
    icon: <FileText className='h-6 w-6' />,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  single_select: {
    type: 'single_select',
    label: 'Single Select',
    description: 'Let guests choose one option from a list',
    defaultQuestion: '',
    icon: <List className='h-6 w-6' />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    hasOptions: true,
  },
  multi_select: {
    type: 'multi_select',
    label: 'Multi Select',
    description: 'Let guests choose multiple options from a list',
    defaultQuestion: '',
    icon: <CheckSquare className='h-6 w-6' />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    hasOptions: true,
  },
  url: {
    type: 'url',
    label: 'URL',
    description: 'Collect a website or link',
    defaultQuestion: '',
    icon: <Link className='h-6 w-6' />,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  phone: {
    type: 'phone',
    label: 'Phone Number',
    description: 'Collect a phone number',
    defaultQuestion: 'What is your phone number?',
    icon: <Phone className='h-6 w-6' />,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    description: 'Get a yes/no or agree/disagree response',
    defaultQuestion: '',
    icon: <Square className='h-6 w-6' />,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  instagram: {
    type: 'instagram',
    label: 'Instagram',
    description: "Get the guest's Instagram username",
    defaultQuestion: 'What is your Instagram profile?',
    icon: <Instagram className='h-6 w-6' />,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  twitter: {
    type: 'twitter',
    label: 'X (Twitter)',
    description: "Get the guest's X (Twitter) handle",
    defaultQuestion: 'What is your X (Twitter) handle?',
    icon: <Twitter className='h-6 w-6' />,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
  youtube: {
    type: 'youtube',
    label: 'YouTube',
    description: "Get the guest's YouTube channel",
    defaultQuestion: 'What is your YouTube channel?',
    icon: <Youtube className='h-6 w-6' />,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  linkedin: {
    type: 'linkedin',
    label: 'LinkedIn',
    description: "Get the guest's LinkedIn profile",
    defaultQuestion: 'What is your LinkedIn profile?',
    icon: <Linkedin className='h-6 w-6' />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  company: {
    type: 'company',
    label: 'Company',
    description: 'Get the company the guest works for',
    defaultQuestion: 'What company do you work for?',
    icon: <Building className='h-6 w-6' />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    autoNote: "We'll automatically pull this information if they've entered it on Evento before.",
  },
};

interface SortableQuestionRowProps {
  question: RegistrationQuestion;
  isUpdating: boolean;
  onToggleEnabled: (questionId: string, currentEnabled: boolean) => void;
  onEdit: (question: RegistrationQuestion) => void;
  onDelete: (question: RegistrationQuestion) => void;
}

function SortableQuestionRow({
  question,
  isUpdating,
  onToggleEnabled,
  onEdit,
  onDelete,
}: SortableQuestionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = questionConfigs[question.type];

  return (
    <div ref={setNodeRef} style={style} className='rounded-2xl bg-gray-50 p-4'>
      <div className='flex items-start gap-4'>
        <button
          type='button'
          className='mt-1.5 cursor-grab touch-none rounded p-1 text-gray-400 active:cursor-grabbing'
          aria-label='Drag to reorder question'
          {...attributes}
          {...listeners}
        >
          <GripVertical className='h-4 w-4' />
        </button>

        <div className='flex-1'>
          <div className='mb-2 flex items-center gap-2'>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.iconBg}`}
            >
              <div className={config.iconColor}>{config.icon}</div>
            </div>
            {question.is_required && (
              <span className='rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600'>
                Required
              </span>
            )}
          </div>

          <h3 className='font-medium text-gray-900'>{question.label}</h3>

          {question.options && question.options.length > 0 && (
            <div className='mt-1 text-sm text-gray-500'>Options: {question.options.join(', ')}</div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => onToggleEnabled(question.id, question.is_enabled)}
            disabled={isUpdating}
            className={`h-6 w-10 rounded-full transition-colors ${
              question.is_enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white transition-transform ${
                question.is_enabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className='rounded p-1 text-gray-600 hover:bg-gray-200'
                aria-label='Question actions'
              >
                <MoreHorizontal className='h-5 w-5' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='z-[70] w-36'>
              <DropdownMenuItem onClick={() => onEdit(question)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                className='text-red-600 focus:text-red-600'
                onClick={() => onDelete(question)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const { setTopBar } = useTopBar();
  const eventId = params.id as string;

  // State for delete confirmation sheet
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    questionId: string | null;
    questionLabel: string;
  }>({
    isOpen: false,
    questionId: null,
    questionLabel: '',
  });

  // Get existing event data from API
  const { data: existingEvent, isLoading: isLoadingEvent, error } = useEventDetails(eventId);

  // Get registration settings and questions
  const { data: settings, isLoading: isLoadingSettings } = useRegistrationSettings(eventId);
  const { data: questions, isLoading: isLoadingQuestions } = useRegistrationQuestions(eventId);

  // Mutations
  const createQuestion = useCreateRegistrationQuestion();
  const reorderQuestions = useReorderRegistrationQuestions();
  const updateSettings = useUpdateRegistrationSettings();
  const updateQuestion = useUpdateRegistrationQuestion();
  const deleteQuestion = useDeleteRegistrationQuestion();
  const [isTogglingRegistration, setIsTogglingRegistration] = useState(false);
  const [localRegistrationRequired, setLocalRegistrationRequired] = useState(false);
  const [isQuestionSheetOpen, setIsQuestionSheetOpen] = useState(false);
  const [questionSheetMode, setQuestionSheetMode] = useState<'choose' | 'create' | 'edit'>(
    'choose'
  );
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [selectedQuestionType, setSelectedQuestionType] = useState<RegistrationQuestionType | null>(
    null
  );
  const [questionLabel, setQuestionLabel] = useState('');
  const [isRequiredNewQuestion, setIsRequiredNewQuestion] = useState(false);
  const [questionOptions, setQuestionOptions] = useState<string[]>(['']);
  const [localQuestions, setLocalQuestions] = useState<RegistrationQuestion[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddQuestion = useCallback(() => {
    setQuestionSheetMode('choose');
    setIsQuestionSheetOpen(true);
  }, []);

  const resetQuestionSheetState = useCallback(() => {
    setQuestionSheetMode('choose');
    setEditingQuestionId(null);
    setSelectedQuestionType(null);
    setQuestionLabel('');
    setIsRequiredNewQuestion(false);
    setQuestionOptions(['']);
  }, []);

  useEffect(() => {
    setTopBar({
      title: 'Registration',
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [],
    });

    return () => {
      setTopBar({
        title: '',
        leftMode: 'menu',
        centerMode: 'title',
        subtitle: '',
        onBackPress: null,
        showAvatar: true,
        buttons: [],
        textButtons: [],
      });
    };
  }, [eventId, router, setTopBar]);

  useEffect(() => {
    setLocalRegistrationRequired(settings?.registration_required ?? false);
  }, [settings?.registration_required]);

  useEffect(() => {
    if (!selectedQuestionType) return;

    const config = questionConfigs[selectedQuestionType];
    setQuestionLabel(config.defaultQuestion ?? '');
    setIsRequiredNewQuestion(false);
    setQuestionOptions(['']);
  }, [selectedQuestionType]);

  useEffect(() => {
    setLocalQuestions(questions ?? []);
  }, [questions]);

  const isLoading = isLoadingEvent || isLoadingSettings || isLoadingQuestions;

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-6 p-4'>
          <Skeleton className='h-4 w-3/4' />

          {/* Registration Settings Skeleton */}
          <div className='rounded-2xl bg-gray-50 p-6'>
            <div className='mb-4 flex items-center gap-3'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='space-y-2'>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-4 w-48' />
              </div>
            </div>
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4'
                >
                  <div className='space-y-1'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-3 w-32' />
                  </div>
                  <Skeleton className='h-6 w-12 rounded-full' />
                </div>
              ))}
            </div>
          </div>

          {/* Information Section Skeleton */}
          <div className='rounded-2xl bg-blue-50 p-4'>
            <Skeleton className='mb-2 h-5 w-40' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mt-1 h-4 w-2/3' />
          </div>
        </div>
      </div>
    );
  }

  if (error || !existingEvent) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>The event you're trying to manage doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const registrationRequired = localRegistrationRequired;
  const questionList = localQuestions;

  const handleToggleRegistrationRequired = async () => {
    if (isTogglingRegistration) return;

    const nextRegistrationState = !registrationRequired;
    setLocalRegistrationRequired(nextRegistrationState);
    setIsTogglingRegistration(true);

    try {
      await updateSettings.mutateAsync({
        eventId,
        registration_required: nextRegistrationState,
      });
      if (!nextRegistrationState) {
        toast.success('Registration disabled');
      }
    } catch {
      setLocalRegistrationRequired(!nextRegistrationState);
      toast.error('Failed to update registration settings');
    } finally {
      setIsTogglingRegistration(false);
    }
  };

  const handleSelectQuestionType = (type: RegistrationQuestionType) => {
    setQuestionSheetMode('create');
    setEditingQuestionId(null);
    setSelectedQuestionType(type);
  };

  const handleBackToQuestionTypes = () => {
    if (questionSheetMode === 'edit') {
      setIsQuestionSheetOpen(false);
      resetQuestionSheetState();
      return;
    }

    setQuestionSheetMode('choose');
    setSelectedQuestionType(null);
  };

  const handleCloseQuestionSheet = (open: boolean) => {
    setIsQuestionSheetOpen(open);

    if (!open) {
      resetQuestionSheetState();
    }
  };

  const handleAddOption = () => {
    setQuestionOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    setQuestionOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    setQuestionOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const selectedQuestionConfig = selectedQuestionType
    ? questionConfigs[selectedQuestionType]
    : null;
  const isQuestionFormValid =
    !!selectedQuestionConfig &&
    questionLabel.trim() !== '' &&
    (!selectedQuestionConfig.hasOptions || questionOptions.some((option) => option.trim() !== ''));

  const handleCreateQuestion = async () => {
    if (!selectedQuestionType || !selectedQuestionConfig || !isQuestionFormValid) return;

    const filteredOptions = questionOptions.filter((option) => option.trim());

    try {
      await createQuestion.mutateAsync({
        eventId,
        type: selectedQuestionType,
        label: questionLabel.trim(),
        options: selectedQuestionConfig.hasOptions ? filteredOptions : undefined,
        is_required: isRequiredNewQuestion,
      });

      toast.success('Question created');
      setIsQuestionSheetOpen(false);
      resetQuestionSheetState();
    } catch {
      toast.error('Failed to create question');
    }
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuestionType || !selectedQuestionConfig || !isQuestionFormValid) return;

    const filteredOptions = questionOptions.filter((option) => option.trim());

    if (questionSheetMode === 'edit' && editingQuestionId) {
      try {
        await updateQuestion.mutateAsync({
          eventId,
          questionId: editingQuestionId,
          label: questionLabel.trim(),
          options: selectedQuestionConfig.hasOptions ? filteredOptions : undefined,
          is_required: isRequiredNewQuestion,
        });

        toast.success('Question updated');
        setIsQuestionSheetOpen(false);
        resetQuestionSheetState();
      } catch {
        toast.error('Failed to update question');
      }

      return;
    }

    await handleCreateQuestion();
  };

  const handleToggleEnabled = async (questionId: string, currentEnabled: boolean) => {
    try {
      await updateQuestion.mutateAsync({
        eventId,
        questionId,
        is_enabled: !currentEnabled,
      });
      toast.success(currentEnabled ? 'Question disabled' : 'Question enabled');
    } catch {
      toast.error('Failed to update question');
    }
  };

  const handleDeleteClick = (question: RegistrationQuestion) => {
    setDeleteConfirmation({
      isOpen: true,
      questionId: question.id,
      questionLabel: question.label,
    });
  };

  const handleEditQuestion = (question: RegistrationQuestion) => {
    setEditingQuestionId(question.id);
    setSelectedQuestionType(question.type);
    setQuestionLabel(question.label);
    setIsRequiredNewQuestion(question.is_required);
    setQuestionOptions(question.options && question.options.length > 0 ? question.options : ['']);
    setQuestionSheetMode('edit');
    setIsQuestionSheetOpen(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = questionList.findIndex((question) => question.id === active.id);
    const newIndex = questionList.findIndex((question) => question.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const previousQuestions = questionList;
    const reorderedQuestions = arrayMove(questionList, oldIndex, newIndex);

    setLocalQuestions(reorderedQuestions);

    try {
      await reorderQuestions.mutateAsync({
        eventId,
        question_ids: reorderedQuestions.map((question) => question.id),
      });
    } catch {
      setLocalQuestions(previousQuestions);
      toast.error('Failed to reorder questions');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.questionId) return;

    try {
      await deleteQuestion.mutateAsync({
        eventId,
        questionId: deleteConfirmation.questionId,
      });
      toast.success('Question deleted');
    } catch {
      toast.error('Failed to delete question');
    } finally {
      setDeleteConfirmation({ isOpen: false, questionId: null, questionLabel: '' });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, questionId: null, questionLabel: '' });
  };

  const renderQuestionTypeSection = (title: string, types: QuestionTypeOption[]) => (
    <div className='mb-6'>
      <h3 className='mb-3 px-4 text-sm font-medium text-gray-500'>{title}</h3>
      <div className='space-y-1'>
        {types.map((questionType) => (
          <button
            key={questionType.key}
            onClick={() => handleSelectQuestionType(questionType.key)}
            className='flex w-full items-center gap-4 rounded-xl p-4 transition-colors hover:bg-gray-50'
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${questionType.iconBg}`}
            >
              <div className={questionType.iconColor}>{questionType.icon}</div>
            </div>
            <div className='flex-1 text-left'>
              <h4 className='font-medium text-gray-900'>{questionType.label}</h4>
            </div>
            <div className='text-gray-400'>
              <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='m9 18 6-6-6-6'
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Content */}
      <div className='space-y-6 p-4'>
        {/* Registration Toggle */}
        <div className='rounded-2xl bg-gray-50 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100'>
                <ClipboardList className='h-5 w-5 text-purple-600' />
              </div>
              <div>
                <h3 className='font-medium'>Require Registration</h3>
                <p className='text-sm text-gray-500'>Guests must register to RSVP</p>
              </div>
            </div>
            <button
              onClick={handleToggleRegistrationRequired}
              disabled={isTogglingRegistration}
              className={`h-6 w-10 rounded-full transition-colors ${
                registrationRequired ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition-transform ${
                  registrationRequired ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {registrationRequired && (
          <>
            {/* Questions List */}
            {questionList.length > 0 ? (
              <div className='space-y-3'>
                <div className='text-sm text-gray-500'>
                  Guests will be asked these questions when they register for your event.
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={questionList.map((question) => question.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className='space-y-3'>
                      {questionList.map((question) => (
                        <SortableQuestionRow
                          key={question.id}
                          question={question}
                          isUpdating={updateQuestion.isPending}
                          onToggleEnabled={handleToggleEnabled}
                          onEdit={handleEditQuestion}
                          onDelete={handleDeleteClick}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <button
                  onClick={handleAddQuestion}
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600'
                >
                  <Plus className='h-4 w-4' />
                  Add New Question
                </button>
              </div>
            ) : (
              <div className='py-16 text-center'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
                  <Settings className='h-8 w-8 text-gray-400' />
                </div>
                <h3 className='mb-2 text-lg font-medium text-gray-900'>Registration Questions</h3>
                <p className='mb-6 text-sm text-gray-500'>
                  Add questions to collect information from guests when they register for your
                  event.
                </p>
                <button
                  onClick={handleAddQuestion}
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600'
                >
                  <Plus className='h-4 w-4' />
                  Add Question
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <MasterScrollableSheet
        title='Choose New Question'
        open={isQuestionSheetOpen}
        onOpenChange={handleCloseQuestionSheet}
        headerLeft={
          questionSheetMode === 'choose' ? (
            <h2 className='text-xl font-semibold'>Choose New Question</h2>
          ) : (
            <div className='flex items-center gap-3'>
              <button
                onClick={handleBackToQuestionTypes}
                className='rounded-full p-2 transition-colors hover:bg-gray-100'
                aria-label='Back to question types'
              >
                <ArrowLeft className='h-5 w-5' />
              </button>
              <h2 className='text-xl font-semibold'>
                {questionSheetMode === 'edit' ? 'Edit Question' : 'Add Question'}
              </h2>
            </div>
          )
        }
        footer={
          questionSheetMode === 'choose' ? null : (
            <Button
              onClick={handleSaveQuestion}
              className={`w-full rounded-xl py-3 font-medium transition-all ${
                isQuestionFormValid && !createQuestion.isPending
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'cursor-not-allowed bg-gray-300 text-gray-500'
              }`}
              disabled={
                !isQuestionFormValid || createQuestion.isPending || updateQuestion.isPending
              }
            >
              {createQuestion.isPending || updateQuestion.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {questionSheetMode === 'edit' ? 'Updating...' : 'Saving...'}
                </>
              ) : questionSheetMode === 'edit' ? (
                'Save Changes'
              ) : (
                'Save Question'
              )}
            </Button>
          )
        }
        contentClassName='pb-6'
      >
        <div
          key={
            questionSheetMode === 'choose'
              ? 'choose-type'
              : (selectedQuestionType ?? 'question-form')
          }
          className='px-4 pt-2 duration-200 animate-in fade-in-0'
        >
          {questionSheetMode === 'choose' ? (
            <>
              {renderQuestionTypeSection('Basic', basicQuestions)}
              {renderQuestionTypeSection('Social Profile', socialProfileQuestions)}
              <div className='mb-6 px-4'>
                <p className='text-sm text-gray-500'>
                  We will retrieve this information automatically if guests have added it to their
                  Evento profile.
                </p>
              </div>
              {renderQuestionTypeSection('Other', otherQuestions)}
            </>
          ) : (
            <>
              <div className='mb-6 flex items-center gap-4'>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${selectedQuestionConfig?.iconBg}`}
                >
                  <div className={selectedQuestionConfig?.iconColor}>
                    {selectedQuestionConfig?.icon}
                  </div>
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {selectedQuestionConfig?.label}
                  </h3>
                  <p className='text-sm text-gray-500'>{selectedQuestionConfig?.description}</p>
                </div>
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>Question Label</label>
                <input
                  type='text'
                  value={questionLabel}
                  onChange={(event) => setQuestionLabel(event.target.value)}
                  placeholder='Enter your question'
                  className='w-full rounded-xl border border-gray-300 p-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500'
                />
              </div>

              {selectedQuestionConfig?.autoNote && (
                <div className='mt-4 rounded-xl bg-blue-50 p-4'>
                  <p className='text-sm text-blue-700'>{selectedQuestionConfig.autoNote}</p>
                </div>
              )}

              {selectedQuestionConfig?.hasOptions && (
                <div className='mt-6 space-y-3'>
                  <label className='block text-sm font-medium text-gray-700'>Options</label>
                  {questionOptions.map((option, index) => (
                    <div key={index} className='flex gap-2'>
                      <input
                        type='text'
                        value={option}
                        onChange={(event) => handleOptionChange(index, event.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className='flex-1 rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500'
                      />
                      {questionOptions.length > 1 && (
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className='rounded-lg px-3 py-2 text-red-600 hover:bg-red-50'
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddOption}
                    className='w-full rounded-lg border-2 border-dashed border-gray-300 p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                  >
                    + Add Option
                  </button>
                </div>
              )}

              <div className='mt-6 flex items-center justify-between rounded-xl bg-gray-50 p-4'>
                <div>
                  <h3 className='font-medium text-gray-900'>Required</h3>
                  <p className='text-sm text-gray-500'>
                    Guests must answer this question to register.
                  </p>
                </div>
                <button
                  onClick={() => setIsRequiredNewQuestion((prev) => !prev)}
                  className={`h-6 w-12 rounded-full transition-colors ${
                    isRequiredNewQuestion ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      isRequiredNewQuestion ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      </MasterScrollableSheet>

      {/* Delete Confirmation Sheet */}
      <MasterScrollableSheet
        title='Delete Question'
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelDelete();
        }}
        footer={
          <div className='flex gap-3'>
            <Button variant='outline' className='flex-1' onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              className='flex-1'
              onClick={handleConfirmDelete}
              disabled={deleteQuestion.isPending}
            >
              {deleteQuestion.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      >
        <div className='p-4 text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <Trash2 className='h-8 w-8 text-red-600' />
          </div>
          <h3 className='mb-2 text-lg font-semibold'>Delete this question?</h3>
          <p className='text-gray-600'>
            &quot;{deleteConfirmation.questionLabel}&quot; will be permanently deleted. This action
            cannot be undone.
          </p>
        </div>
      </MasterScrollableSheet>
    </div>
  );
}
