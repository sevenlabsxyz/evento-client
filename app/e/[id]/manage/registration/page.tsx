'use client';

import DescriptionSheet from '@/components/create-event/description-sheet';
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
import { usePublishEvent } from '@/lib/hooks/use-publish-event';
import { useRegistrationQuestions } from '@/lib/hooks/use-registration-questions';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useReorderRegistrationQuestions } from '@/lib/hooks/use-reorder-registration-questions';
import { useUpdateRegistrationQuestion } from '@/lib/hooks/use-update-registration-question';
import { useUpdateRegistrationSettings } from '@/lib/hooks/use-update-registration-settings';
import type { Translator } from '@/lib/i18n/types';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { RegistrationQuestion, RegistrationQuestionType } from '@/lib/types/api';
import { getContentPreview, isContentEmpty } from '@/lib/utils/content';
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
  MessageSquareText,
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
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface QuestionTypeOption {
  key: RegistrationQuestionType;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

interface QuestionConfig {
  type: RegistrationQuestionType;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  hasOptions?: boolean;
}

const basicQuestions: QuestionTypeOption[] = [
  {
    key: 'text',
    icon: <Type className='h-6 w-6' />,
    iconBg: 'bg-red-100 dark:bg-red-950/60',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    key: 'long_text',
    icon: <FileText className='h-6 w-6' />,
    iconBg: 'bg-red-100 dark:bg-red-950/60',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    key: 'single_select',
    icon: <List className='h-6 w-6' />,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'multi_select',
    icon: <CheckSquare className='h-6 w-6' />,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'url',
    icon: <Link className='h-6 w-6' />,
    iconBg: 'bg-purple-100 dark:bg-purple-950/60',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    key: 'phone',
    icon: <Phone className='h-6 w-6' />,
    iconBg: 'bg-green-100 dark:bg-green-950/60',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    key: 'checkbox',
    icon: <Square className='h-6 w-6' />,
    iconBg: 'bg-yellow-100 dark:bg-yellow-950/60',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
];

const socialProfileQuestions: QuestionTypeOption[] = [
  {
    key: 'instagram',
    icon: <Instagram className='h-6 w-6' />,
    iconBg: 'bg-pink-100 dark:bg-pink-950/60',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    key: 'twitter',
    icon: <Twitter className='h-6 w-6' />,
    iconBg: 'bg-gray-100 dark:bg-neutral-800',
    iconColor: 'text-gray-600 dark:text-neutral-400',
  },
  {
    key: 'youtube',
    icon: <Youtube className='h-6 w-6' />,
    iconBg: 'bg-red-100 dark:bg-red-950/60',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    key: 'linkedin',
    icon: <Linkedin className='h-6 w-6' />,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
];

const otherQuestions: QuestionTypeOption[] = [
  {
    key: 'company',
    icon: <Building className='h-6 w-6' />,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
];

const questionConfigs: Record<RegistrationQuestionType, QuestionConfig> = {
  text: {
    type: 'text',
    icon: <Type className='h-6 w-6' />,
    iconBg: 'bg-red-100 dark:bg-red-950/60',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  long_text: {
    type: 'long_text',
    icon: <FileText className='h-6 w-6' />,
    iconBg: 'bg-red-100 dark:bg-red-950/60',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  single_select: {
    type: 'single_select',
    icon: <List className='h-6 w-6' />,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    hasOptions: true,
  },
  multi_select: {
    type: 'multi_select',
    icon: <CheckSquare className='h-6 w-6' />,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    hasOptions: true,
  },
  url: {
    type: 'url',
    icon: <Link className='h-6 w-6' />,
    iconBg: 'bg-purple-100 dark:bg-purple-950/60',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  phone: {
    type: 'phone',
    icon: <Phone className='h-6 w-6' />,
    iconBg: 'bg-green-100 dark:bg-green-950/60',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  checkbox: {
    type: 'checkbox',
    icon: <Square className='h-6 w-6' />,
    iconBg: 'bg-yellow-100 dark:bg-yellow-950/60',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  instagram: {
    type: 'instagram',
    icon: <Instagram className='h-6 w-6' />,
    iconBg: 'bg-pink-100 dark:bg-pink-950/60',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  twitter: {
    type: 'twitter',
    icon: <Twitter className='h-6 w-6' />,
    iconBg: 'bg-gray-100 dark:bg-neutral-800',
    iconColor: 'text-gray-600 dark:text-neutral-400',
  },
  youtube: {
    type: 'youtube',
    icon: <Youtube className='h-6 w-6' />,
    iconBg: 'bg-red-100 dark:bg-red-950/60',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  linkedin: {
    type: 'linkedin',
    icon: <Linkedin className='h-6 w-6' />,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  company: {
    type: 'company',
    icon: <Building className='h-6 w-6' />,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

type ManageLegacyT = Translator<'manageLegacy'>;

interface QuestionTypeText {
  label: string;
  description: string;
  defaultQuestion: string;
  autoNote?: string;
}

function getQuestionTypeText(t: ManageLegacyT, type: RegistrationQuestionType): QuestionTypeText {
  switch (type) {
    case 'text':
      return {
        label: t('registration.questionTypes.text'),
        description: t('registration.questionDescriptions.text'),
        defaultQuestion: '',
      };
    case 'long_text':
      return {
        label: t('registration.questionTypes.longText'),
        description: t('registration.questionDescriptions.longText'),
        defaultQuestion: '',
      };
    case 'single_select':
      return {
        label: t('registration.questionTypes.singleSelect'),
        description: t('registration.questionDescriptions.singleSelect'),
        defaultQuestion: '',
      };
    case 'multi_select':
      return {
        label: t('registration.questionTypes.multiSelect'),
        description: t('registration.questionDescriptions.multiSelect'),
        defaultQuestion: '',
      };
    case 'url':
      return {
        label: 'URL',
        description: t('registration.questionDescriptions.url'),
        defaultQuestion: '',
      };
    case 'phone':
      return {
        label: t('registration.questionTypes.phone'),
        description: t('registration.questionDescriptions.phone'),
        defaultQuestion: t('registrationAdd.defaultQuestions.phone'),
      };
    case 'checkbox':
      return {
        label: t('registration.questionTypes.checkbox'),
        description: t('registration.questionDescriptions.checkbox'),
        defaultQuestion: '',
      };
    case 'instagram':
      return {
        label: 'Instagram',
        description: t('registration.questionDescriptions.instagram'),
        defaultQuestion: t('registrationAdd.defaultQuestions.instagram'),
      };
    case 'twitter':
      return {
        label: 'X (Twitter)',
        description: t('registration.questionDescriptions.twitter'),
        defaultQuestion: t('registrationAdd.defaultQuestions.twitter'),
      };
    case 'youtube':
      return {
        label: 'YouTube',
        description: t('registration.questionDescriptions.youtube'),
        defaultQuestion: t('registrationAdd.defaultQuestions.youtube'),
      };
    case 'linkedin':
      return {
        label: 'LinkedIn',
        description: t('registration.questionDescriptions.linkedin'),
        defaultQuestion: t('registrationAdd.defaultQuestions.linkedin'),
      };
    case 'company':
      return {
        label: t('registration.questionTypes.company'),
        description: t('registration.questionDescriptions.company'),
        defaultQuestion: t('registrationAdd.defaultQuestions.company'),
        autoNote: t('registration.companyAutoNote'),
      };
  }
}

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

  const t = useTranslations('manageLegacy');
  const tCommon = useTranslations('common');
  const config = questionConfigs[question.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-800'
    >
      <div className='flex items-start gap-4'>
        <button
          type='button'
          className='mt-1.5 cursor-grab touch-none rounded p-1 text-gray-400 active:cursor-grabbing dark:text-neutral-500'
          aria-label={t('registration.row.dragToReorder')}
          {...attributes}
          {...listeners}
        >
          <GripVertical className='h-4 w-4' />
        </button>

        <div className='flex-1'>
          <div className='mb-2 flex items-center gap-2'>
            <span
              className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium leading-none ${config.iconBg} ${config.iconColor}`}
            >
              {getQuestionTypeText(t, question.type).label}
            </span>
            {question.is_required && (
              <span className='whitespace-nowrap rounded bg-red-100 px-2 py-1 text-xs font-medium leading-none text-red-600 dark:bg-red-950/60 dark:text-red-400'>
                {t('registration.form.required')}
              </span>
            )}
          </div>

          <h3 className='font-medium text-gray-900 dark:text-neutral-100'>{question.label}</h3>

          {question.options && question.options.length > 0 && (
            <div className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
              {t('registration.row.options', { options: question.options.join(', ') })}
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => onToggleEnabled(question.id, question.is_enabled)}
            disabled={isUpdating}
            className={`h-6 w-10 rounded-full transition-colors ${
              question.is_enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white transition-transform dark:bg-neutral-900 ${
                question.is_enabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className='rounded p-1 text-gray-600 hover:bg-gray-200 dark:text-neutral-400 dark:hover:bg-neutral-700'
                aria-label={t('registration.row.questionActions')}
              >
                <MoreHorizontal className='h-5 w-5' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='z-[70] w-36'>
              <DropdownMenuItem onClick={() => onEdit(question)}>
                {tCommon('actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className='text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400'
                onClick={() => onDelete(question)}
              >
                {tCommon('actions.delete')}
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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const eventId = params.id as string;
  const shouldEnableRegistration = searchParams.get('enableRegistration') === '1';
  const t = useTranslations('manageLegacy');
  const tCommon = useTranslations('common');
  const topBarTitle = t('registration.topBarTitle');
  const publishLabel = t('registration.publish.action');

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
  const publishEvent = usePublishEvent();

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
  const [customApprovalMessageEnabled, setCustomApprovalMessageEnabled] = useState(false);
  const [customApprovalMessage, setCustomApprovalMessage] = useState('<p></p>');
  const [showCustomMessageSheet, setShowCustomMessageSheet] = useState(false);
  const [isUpdatingCustomMessage, setIsUpdatingCustomMessage] = useState(false);
  const [showPublishSheet, setShowPublishSheet] = useState(false);
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
  const hasAutoEnabledRegistration = useRef(false);

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
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: topBarTitle,
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [],
      textButtons:
        existingEvent?.status === 'draft'
          ? [
              {
                id: 'publish-event',
                label: publishLabel,
                onClick: () => setShowPublishSheet(true),
                disabled: publishEvent.isPending,
              },
            ]
          : [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [
    eventId,
    router,
    pathname,
    existingEvent?.status,
    publishEvent.isPending,
    setTopBarForRoute,
    applyRouteConfig,
    clearRoute,
    topBarTitle,
    publishLabel,
  ]);

  useEffect(() => {
    setLocalRegistrationRequired(settings?.registration_required ?? false);
  }, [settings?.registration_required]);

  useEffect(() => {
    setCustomApprovalMessageEnabled(settings?.custom_rsvp_email_enabled ?? false);
    setCustomApprovalMessage(settings?.custom_rsvp_email_content ?? '<p></p>');
  }, [settings?.custom_rsvp_email_enabled, settings?.custom_rsvp_email_content]);

  useEffect(() => {
    const requiresRegistrationByType =
      existingEvent?.type === 'registration' || existingEvent?.type === 'ticketed';
    const requiresRegistration = shouldEnableRegistration || requiresRegistrationByType;
    const isRegistrationDisabled = !(settings?.registration_required ?? false);

    if (
      !requiresRegistration ||
      !isRegistrationDisabled ||
      isLoadingSettings ||
      isTogglingRegistration ||
      hasAutoEnabledRegistration.current
    ) {
      return;
    }

    hasAutoEnabledRegistration.current = true;
    setLocalRegistrationRequired(true);

    updateSettings
      .mutateAsync({
        eventId,
        registration_required: true,
      })
      .catch(() => {
        hasAutoEnabledRegistration.current = false;
        setLocalRegistrationRequired(false);
        toast.error(t('registration.toasts.enableFailed'));
      });
  }, [
    eventId,
    existingEvent?.type,
    isLoadingSettings,
    isTogglingRegistration,
    settings?.registration_required,
    shouldEnableRegistration,
    updateSettings,
    t,
  ]);

  useEffect(() => {
    if (!selectedQuestionType) return;

    setQuestionLabel(getQuestionTypeText(t, selectedQuestionType).defaultQuestion);
    setIsRequiredNewQuestion(false);
    setQuestionOptions(['']);
  }, [selectedQuestionType, t]);

  useEffect(() => {
    setLocalQuestions(questions ?? []);
  }, [questions]);

  const handlePublishEvent = async () => {
    try {
      await publishEvent.mutateAsync(eventId);
      toast.success(t('registration.publish.success'));
      setShowPublishSheet(false);
      router.push(`/e/${eventId}`);
    } catch (error: any) {
      toast.error(error?.message || t('registration.publish.failed'));
    }
  };

  const isLoading = isLoadingEvent || isLoadingSettings || isLoadingQuestions;

  if (isLoading) {
    return (
      <div className='space-y-4 py-4 md:py-6'>
        <div className='max-w-2xl space-y-6'>
          <Skeleton className='h-4 w-3/4' />

          {/* Registration Settings Skeleton */}
          <div className='rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900'>
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
                  className='flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
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
          <div className='rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/40'>
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
      <div className='flex items-center justify-center py-16'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            {t('registration.eventNotFound.title')}
          </h1>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            {t('registration.eventNotFound.description')}
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {t('registration.invalidType.goBack')}
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
        toast.success(t('registration.toasts.registrationDisabled'));
      }
    } catch {
      setLocalRegistrationRequired(!nextRegistrationState);
      toast.error(t('registration.toasts.settingsUpdateFailed'));
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
  const selectedQuestionText = selectedQuestionType
    ? getQuestionTypeText(t, selectedQuestionType)
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

      toast.success(t('registrationAdd.toasts.created'));
      setIsQuestionSheetOpen(false);
      resetQuestionSheetState();
    } catch {
      toast.error(t('registrationAdd.toasts.createFailed'));
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

        toast.success(t('registrationEdit.toasts.updated'));
        setIsQuestionSheetOpen(false);
        resetQuestionSheetState();
      } catch {
        toast.error(t('registrationEdit.toasts.updateFailed'));
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
      toast.success(
        currentEnabled
          ? t('registration.toasts.questionDisabled')
          : t('registration.toasts.questionEnabled')
      );
    } catch {
      toast.error(t('registrationEdit.toasts.updateFailed'));
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
      toast.error(t('registration.toasts.reorderFailed'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.questionId) return;

    try {
      await deleteQuestion.mutateAsync({
        eventId,
        questionId: deleteConfirmation.questionId,
      });
      toast.success(t('registration.toasts.questionDeleted'));
    } catch {
      toast.error(t('registration.toasts.deleteFailed'));
    } finally {
      setDeleteConfirmation({ isOpen: false, questionId: null, questionLabel: '' });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, questionId: null, questionLabel: '' });
  };

  const handleToggleCustomApprovalMessage = async () => {
    if (isUpdatingCustomMessage) return;

    const nextEnabled = !customApprovalMessageEnabled;
    setCustomApprovalMessageEnabled(nextEnabled);
    setIsUpdatingCustomMessage(true);

    try {
      await updateSettings.mutateAsync({
        eventId,
        custom_rsvp_email_enabled: nextEnabled,
      });
      toast.success(
        nextEnabled
          ? t('registration.customMessage.toasts.enabled')
          : t('registration.customMessage.toasts.disabled')
      );
    } catch {
      setCustomApprovalMessageEnabled(!nextEnabled);
      toast.error(t('registration.customMessage.toasts.updateFailed'));
    } finally {
      setIsUpdatingCustomMessage(false);
    }
  };

  const handleSaveCustomApprovalMessage = async (content: string) => {
    if (isUpdatingCustomMessage) return;

    const message = content.trim() ? content : '<p></p>';
    const previousMessage = customApprovalMessage;
    setCustomApprovalMessage(message);
    setIsUpdatingCustomMessage(true);

    try {
      await updateSettings.mutateAsync({
        eventId,
        custom_rsvp_email_enabled: customApprovalMessageEnabled,
        custom_rsvp_email_content: message,
      });
      toast.success(t('registration.customMessage.toasts.saved'));
    } catch (error) {
      setCustomApprovalMessage(previousMessage);
      toast.error(t('registration.customMessage.toasts.saveFailed'));
      throw error; // Re-throw to prevent DescriptionSheet from closing
    } finally {
      setIsUpdatingCustomMessage(false);
    }
  };

  const renderQuestionTypeSection = (title: string, types: QuestionTypeOption[]) => (
    <div className='mb-6'>
      <h3 className='mb-3 px-4 text-sm font-medium text-gray-500 dark:text-neutral-400'>{title}</h3>
      <div className='space-y-1'>
        {types.map((questionType) => (
          <button
            key={questionType.key}
            onClick={() => handleSelectQuestionType(questionType.key)}
            className='flex w-full items-center gap-4 rounded-xl p-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-950'
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${questionType.iconBg}`}
            >
              <div className={questionType.iconColor}>{questionType.icon}</div>
            </div>
            <div className='flex-1 text-left'>
              <h4 className='font-medium text-gray-900 dark:text-neutral-100'>
                {getQuestionTypeText(t, questionType.key).label}
              </h4>
            </div>
            <div className='text-gray-400 dark:text-neutral-500'>
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
    <div className='space-y-4 py-4 md:py-6'>
      <div className='max-w-2xl space-y-1'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
          {t('registration.title')}
        </h2>
        <p className='text-sm text-gray-500 dark:text-neutral-400'>{t('registration.subtitle')}</p>
      </div>

      <div className='max-w-2xl space-y-4'>
        {/* Registration Toggle */}
        <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60'>
                <ClipboardList className='h-5 w-5 text-purple-600 dark:text-purple-400' />
              </div>
              <div className='min-w-0'>
                <h3 className='font-medium'>{t('registration.requireRegistration.title')}</h3>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {t('registration.requireRegistration.description')}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleRegistrationRequired}
              disabled={isTogglingRegistration}
              className={`h-6 w-10 rounded-full transition-colors ${
                registrationRequired ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition-transform dark:bg-neutral-900 ${
                  registrationRequired ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {registrationRequired && (
          <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60'>
                  <MessageSquareText className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div className='min-w-0'>
                  <h3 className='font-medium'>{t('registration.customMessage.title')}</h3>
                  <p className='text-sm text-gray-500 dark:text-neutral-400'>
                    {t('registration.customMessage.description')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleCustomApprovalMessage}
                disabled={isUpdatingCustomMessage}
                className={`h-6 w-10 rounded-full transition-colors ${
                  customApprovalMessageEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform dark:bg-neutral-900 ${
                    customApprovalMessageEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {customApprovalMessageEnabled && (
              <button
                onClick={() => setShowCustomMessageSheet(true)}
                className='mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700'
              >
                <p className='text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
                  {t('registration.customMessage.messageLabel')}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    isContentEmpty(customApprovalMessage)
                      ? 'text-gray-400 dark:text-neutral-500'
                      : 'text-gray-900 dark:text-neutral-100'
                  }`}
                >
                  {isContentEmpty(customApprovalMessage)
                    ? t('registration.customMessage.emptyPreview')
                    : getContentPreview(customApprovalMessage, 110)}
                </p>
              </button>
            )}
          </div>
        )}

        {registrationRequired && (
          <section className='space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
            <div>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                {t('registration.questions.title')}
              </h3>
              <p className='text-sm text-gray-500 dark:text-neutral-400'>
                {t('registration.questions.description')}
              </p>
            </div>
            {/* Questions List */}
            {questionList.length > 0 ? (
              <div className='space-y-3'>
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
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                >
                  <Plus className='h-4 w-4' />
                  {t('registration.questions.addNew')}
                </button>
              </div>
            ) : (
              <div className='py-10 text-center'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
                  <Settings className='h-8 w-8 text-gray-400 dark:text-neutral-500' />
                </div>
                <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-neutral-100'>
                  {t('registration.questions.emptyTitle')}
                </h3>
                <p className='mb-6 text-sm text-gray-500 dark:text-neutral-400'>
                  {t('registration.questions.emptyDescription')}
                </p>
                <button
                  onClick={handleAddQuestion}
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                >
                  <Plus className='h-4 w-4' />
                  {t('registrationAdd.title')}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      <DescriptionSheet
        isOpen={showCustomMessageSheet}
        onClose={() => setShowCustomMessageSheet(false)}
        onSave={handleSaveCustomApprovalMessage}
        initialContent={customApprovalMessage}
        title={t('registration.customMessage.title')}
        placeholder={t('registration.customMessage.placeholder')}
      />

      <MasterScrollableSheet
        title={t('registration.publish.title')}
        open={showPublishSheet}
        onOpenChange={setShowPublishSheet}
        footer={
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='h-11 flex-1'
              onClick={() => setShowPublishSheet(false)}
              disabled={publishEvent.isPending}
            >
              {tCommon('actions.cancel')}
            </Button>
            <Button
              className='h-11 flex-1'
              onClick={handlePublishEvent}
              disabled={publishEvent.isPending}
            >
              {publishEvent.isPending
                ? t('registration.publish.publishing')
                : t('registration.publish.confirm')}
            </Button>
          </div>
        }
      >
        <div className='px-4 pb-4 text-sm text-gray-600 dark:text-neutral-400'>
          {t('registration.publish.description')}
        </div>
      </MasterScrollableSheet>

      <MasterScrollableSheet
        title={t('registration.questionSheet.chooseTitle')}
        open={isQuestionSheetOpen}
        onOpenChange={handleCloseQuestionSheet}
        headerLeft={
          questionSheetMode === 'choose' ? (
            <h2 className='text-xl font-semibold'>{t('registration.questionSheet.chooseTitle')}</h2>
          ) : (
            <div className='flex items-center gap-3'>
              <button
                onClick={handleBackToQuestionTypes}
                className='rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
                aria-label={t('registration.questionSheet.backToTypes')}
              >
                <ArrowLeft className='h-5 w-5' />
              </button>
              <h2 className='text-xl font-semibold'>
                {questionSheetMode === 'edit'
                  ? t('registrationEdit.title')
                  : t('registrationAdd.title')}
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
                  ? 'bg-black text-white hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                  : 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-neutral-600 dark:text-neutral-400'
              }`}
              disabled={
                !isQuestionFormValid || createQuestion.isPending || updateQuestion.isPending
              }
            >
              {createQuestion.isPending || updateQuestion.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {questionSheetMode === 'edit'
                    ? t('registration.questionSheet.updating')
                    : tCommon('states.saving')}
                </>
              ) : questionSheetMode === 'edit' ? (
                t('registration.questionSheet.saveChanges')
              ) : (
                t('registration.questionSheet.saveQuestion')
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
              {renderQuestionTypeSection(t('registrationTypes.sections.basic'), basicQuestions)}
              {renderQuestionTypeSection(
                t('registrationTypes.sections.socialProfile'),
                socialProfileQuestions
              )}
              <div className='mb-6 px-4'>
                <p className='text-sm text-gray-500 dark:text-neutral-400'>
                  {t('registration.questionSheet.socialNote')}
                </p>
              </div>
              {renderQuestionTypeSection(t('registrationTypes.sections.other'), otherQuestions)}
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
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
                    {selectedQuestionText?.label}
                  </h3>
                  <p className='text-sm text-gray-500 dark:text-neutral-400'>
                    {selectedQuestionText?.description}
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700 dark:text-neutral-300'>
                  {t('registration.form.questionLabel')}
                </label>
                <input
                  type='text'
                  value={questionLabel}
                  onChange={(event) => setQuestionLabel(event.target.value)}
                  placeholder={t('registration.form.questionPlaceholder')}
                  className='w-full rounded-xl border border-gray-300 p-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:caret-neutral-100 dark:placeholder:text-neutral-500'
                />
              </div>

              {selectedQuestionText?.autoNote && (
                <div className='mt-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40'>
                  <p className='text-sm text-blue-700 dark:text-blue-400'>
                    {selectedQuestionText.autoNote}
                  </p>
                </div>
              )}

              {selectedQuestionConfig?.hasOptions && (
                <div className='mt-6 space-y-3'>
                  <label className='block text-sm font-medium text-gray-700 dark:text-neutral-300'>
                    {t('registration.form.options')}
                  </label>
                  {questionOptions.map((option, index) => (
                    <div key={index} className='flex gap-2'>
                      <input
                        type='text'
                        value={option}
                        onChange={(event) => handleOptionChange(index, event.target.value)}
                        placeholder={t('registration.form.optionPlaceholder', {
                          number: index + 1,
                        })}
                        className='flex-1 rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:caret-neutral-100 dark:placeholder:text-neutral-500'
                      />
                      {questionOptions.length > 1 && (
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className='rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
                        >
                          {tCommon('actions.remove')}
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddOption}
                    className='w-full rounded-lg border-2 border-dashed border-gray-300 p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-300'
                  >
                    {t('registration.form.addOption')}
                  </button>
                </div>
              )}

              <div className='mt-6 flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-neutral-950'>
                <div>
                  <h3 className='font-medium text-gray-900 dark:text-neutral-100'>
                    {t('registration.form.required')}
                  </h3>
                  <p className='text-sm text-gray-500 dark:text-neutral-400'>
                    {t('registration.questionSheet.requiredDescription')}
                  </p>
                </div>
                <button
                  onClick={() => setIsRequiredNewQuestion((prev) => !prev)}
                  className={`h-6 w-12 rounded-full transition-colors ${
                    isRequiredNewQuestion
                      ? 'bg-red-500 dark:bg-red-600'
                      : 'bg-gray-300 dark:bg-neutral-600'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform dark:bg-neutral-900 ${
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
        title={t('registration.deleteSheet.title')}
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelDelete();
        }}
        footer={
          <div className='flex gap-3'>
            <Button variant='outline' className='flex-1' onClick={handleCancelDelete}>
              {tCommon('actions.cancel')}
            </Button>
            <Button
              variant='destructive'
              className='flex-1'
              onClick={handleConfirmDelete}
              disabled={deleteQuestion.isPending}
            >
              {deleteQuestion.isPending
                ? t('registration.deleteSheet.deleting')
                : tCommon('actions.delete')}
            </Button>
          </div>
        }
      >
        <div className='p-4 text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60'>
            <Trash2 className='h-8 w-8 text-red-600 dark:text-red-400' />
          </div>
          <h3 className='mb-2 text-lg font-semibold'>{t('registration.deleteSheet.heading')}</h3>
          <p className='text-gray-600 dark:text-neutral-400'>
            {t('registration.deleteSheet.description', { label: deleteConfirmation.questionLabel })}
          </p>
        </div>
      </MasterScrollableSheet>
    </div>
  );
}
