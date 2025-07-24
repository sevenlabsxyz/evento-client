'use client';

import { useEventDetails } from '@/lib/hooks/useEventDetails';
import { ArrowLeft, GripVertical, Plus, Settings, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

type QuestionType =
	| 'text'
	| 'long-text'
	| 'single-select'
	| 'multi-select'
	| 'url'
	| 'phone'
	| 'checkbox'
	| 'instagram'
	| 'twitter'
	| 'youtube'
	| 'linkedin'
	| 'company';

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

	// Get existing event data from API
	const { data: existingEvent, isLoading, error } = useEventDetails(eventId);

	if (isLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-gray-50'>
				<div className='text-center'>
					<div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
					<p className='text-gray-600'>Loading event details...</p>
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

	// Mock registration questions data (empty for now to show empty state)
	const [questions, setQuestions] = useState<RegistrationQuestion[]>([]);

	const handleAddQuestion = () => {
		router.push(`/e/event/${eventId}/manage/registration/types`);
	};

	const handleToggleEnabled = (questionId: string) => {
		setQuestions((prev) =>
			prev.map((q) => (q.id === questionId ? { ...q, enabled: !q.enabled } : q))
		);
	};

	const handleDeleteQuestion = (questionId: string) => {
		setQuestions((prev) => prev.filter((q) => q.id !== questionId));
	};

	const handleEditQuestion = (questionId: string) => {
		const question = questions.find((q) => q.id === questionId);
		if (question) {
			router.push(`/e/event/${eventId}/manage/registration/edit/${question.type}?id=${questionId}`);
		}
	};

	const getQuestionIcon = (type: QuestionType) => {
		switch (type) {
			case 'text':
				return '📝';
			case 'long-text':
				return '📄';
			case 'single-select':
				return '📋';
			case 'multi-select':
				return '☑️';
			case 'url':
				return '🔗';
			case 'phone':
				return '📞';
			case 'checkbox':
				return '✅';
			case 'instagram':
				return '📷';
			case 'twitter':
				return '🐦';
			case 'youtube':
				return '📺';
			case 'linkedin':
				return '💼';
			case 'company':
				return '🏢';
			default:
				return '❓';
		}
	};

	const getQuestionTypeLabel = (type: QuestionType) => {
		switch (type) {
			case 'text':
				return 'Text';
			case 'long-text':
				return 'Long Text';
			case 'single-select':
				return 'Single Select';
			case 'multi-select':
				return 'Multi Select';
			case 'url':
				return 'URL';
			case 'phone':
				return 'Phone Number';
			case 'checkbox':
				return 'Checkbox';
			case 'instagram':
				return 'Instagram';
			case 'twitter':
				return 'X (Twitter)';
			case 'youtube':
				return 'YouTube';
			case 'linkedin':
				return 'LinkedIn';
			case 'company':
				return 'Company';
			default:
				return type;
		}
	};

	return (
		<div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
			{/* Header */}
			<div className='flex items-center justify-between border-b border-gray-100 p-4'>
				<div className='flex items-center gap-4'>
					<button onClick={() => router.back()} className='rounded-full p-2 hover:bg-gray-100'>
						<ArrowLeft className='h-5 w-5' />
					</button>
					<h1 className='text-xl font-semibold'>Registration Questions</h1>
				</div>
				<button onClick={handleAddQuestion} className='rounded-full p-2 hover:bg-gray-100'>
					<Plus className='h-6 w-6' />
				</button>
			</div>

			{/* Content */}
			<div className='p-4'>
				{questions.length > 0 ? (
					<div className='space-y-3'>
						<div className='mb-4 text-sm text-gray-500'>
							Guests will be asked these questions when they register for your event.
						</div>

						{questions.map((question, index) => (
							<div key={question.id} className='rounded-2xl bg-gray-50 p-4'>
								<div className='flex items-start gap-3'>
									{/* Drag Handle */}
									<div className='mt-1'>
										<GripVertical className='h-4 w-4 text-gray-400' />
									</div>

									{/* Question Content */}
									<div className='flex-1'>
										<div className='mb-2 flex items-center gap-2'>
											<span className='text-lg'>{getQuestionIcon(question.type)}</span>
											<span className='rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-500'>
												{getQuestionTypeLabel(question.type)}
											</span>
											{question.required && (
												<span className='rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600'>
													Required
												</span>
											)}
										</div>

										<h3 className='mb-1 font-medium text-gray-900'>{question.label}</h3>

										{question.options && (
											<div className='text-sm text-gray-500'>
												Options: {question.options.join(', ')}
											</div>
										)}
									</div>

									{/* Controls */}
									<div className='flex items-center gap-2'>
										{/* Enable/Disable Toggle */}
										<button
											onClick={() => handleToggleEnabled(question.id)}
											className={`h-6 w-10 rounded-full transition-colors ${
												question.enabled ? 'bg-green-500' : 'bg-gray-300'
											}`}
										>
											<div
												className={`h-4 w-4 rounded-full bg-white transition-transform ${
													question.enabled ? 'translate-x-5' : 'translate-x-1'
												}`}
											/>
										</button>

										{/* Edit Button */}
										<button
											onClick={() => handleEditQuestion(question.id)}
											className='rounded p-1 hover:bg-gray-200'
										>
											<Settings className='h-4 w-4 text-gray-600' />
										</button>

										{/* Delete Button */}
										<button
											onClick={() => handleDeleteQuestion(question.id)}
											className='rounded p-1 hover:bg-red-100'
										>
											<Trash2 className='h-4 w-4 text-red-600' />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='py-16 text-center'>
						<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
							<Settings className='h-8 w-8 text-gray-400' />
						</div>
						<h3 className='mb-2 text-lg font-medium text-gray-900'>No Registration Questions</h3>
						<p className='mb-6 text-sm text-gray-500'>
							Add questions to collect information from guests when they register for your event.
						</p>
						<button
							onClick={handleAddQuestion}
							className='rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600'
						>
							Add Question
						</button>
					</div>
				)}

				{/* Information Section */}
				<div className='mt-8 rounded-2xl bg-blue-50 p-4'>
					<h4 className='mb-2 font-medium text-blue-900'>Registration Questions</h4>
					<p className='text-sm text-blue-700'>
						Use registration questions to collect specific information from your guests. You can
						make questions required or optional, and organize them in any order.
					</p>
				</div>
			</div>
		</div>
	);
}
