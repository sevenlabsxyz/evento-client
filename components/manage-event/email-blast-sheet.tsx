'use client';

import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { VisuallyHidden } from '@silk-hq/components';
import { Clock, Mail } from 'lucide-react';
import { useState } from 'react';
import EmailBlastCompose from './email-blast-compose';
import EmailBlastHistory from './email-blast-history';
import './email-blast-sheet.css';

interface EmailBlastSheetProps {
	isOpen: boolean;
	onClose: () => void;
	eventId: string;
}

export default function EmailBlastSheet({ isOpen, onClose, eventId }: EmailBlastSheetProps) {
	const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');

	const handleClose = () => {
		setActiveTab('compose');
		onClose();
	};

	const handleSendBlast = (data: { recipients: string; subject: string; message: string }) => {
		console.log('Email blast sent successfully:', data);
		// Switch to history tab to show the new blast
		setActiveTab('history');
		// Don't close the sheet immediately - let user see the history
	};

	return (
		<SheetWithDetentFull.Root
			presented={isOpen}
			onPresentedChange={(presented) => !presented && handleClose()}
		>
			<SheetWithDetentFull.Portal>
				<SheetWithDetentFull.View>
					<SheetWithDetentFull.Backdrop />
					<SheetWithDetentFull.Content className='EmailBlastSheet-content'>
						{/* Fixed Header */}
						<div className='EmailBlastSheet-header'>
							<div className='mb-4 flex justify-center pt-4'>
								<SheetWithDetentFull.Handle className='EmailBlastSheet-handle' />
							</div>
							<div className='EmailBlastSheet-headerBar'>
								<button
									onClick={handleClose}
									className='EmailBlastSheet-headerButton EmailBlastSheet-headerButton--cancel'
								>
									Cancel
								</button>
								<h1 className='EmailBlastSheet-headerTitle'>Email Blast</h1>
								<div className='w-16' /> {/* Spacer for centering */}
							</div>

							{/* Tabs */}
							<div className='EmailBlastSheet-tabs'>
								<button
									onClick={() => setActiveTab('compose')}
									className={`EmailBlastSheet-tab ${
										activeTab === 'compose' ? 'EmailBlastSheet-tab--active' : ''
									}`}
								>
									<Mail className='h-4 w-4' />
									<span>Compose</span>
								</button>
								<button
									onClick={() => setActiveTab('history')}
									className={`EmailBlastSheet-tab ${
										activeTab === 'history' ? 'EmailBlastSheet-tab--active' : ''
									}`}
								>
									<Clock className='h-4 w-4' />
									<span>History</span>
								</button>
							</div>
						</div>

						<VisuallyHidden.Root asChild>
							<SheetWithDetentFull.Title>Email Blast</SheetWithDetentFull.Title>
						</VisuallyHidden.Root>

						{/* Scrollable Content */}
						<SheetWithDetentFull.ScrollRoot asChild>
							<SheetWithDetentFull.ScrollView className='EmailBlastSheet-scrollView'>
								<SheetWithDetentFull.ScrollContent className='EmailBlastSheet-scrollContent'>
									{activeTab === 'compose' ? (
										<EmailBlastCompose
											eventId={eventId}
											onSend={handleSendBlast}
											onCancel={handleClose}
										/>
									) : (
										<EmailBlastHistory eventId={eventId} />
									)}
								</SheetWithDetentFull.ScrollContent>
							</SheetWithDetentFull.ScrollView>
						</SheetWithDetentFull.ScrollRoot>
					</SheetWithDetentFull.Content>
				</SheetWithDetentFull.View>
			</SheetWithDetentFull.Portal>
		</SheetWithDetentFull.Root>
	);
}
