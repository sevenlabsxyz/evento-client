'use client';

import Bold from '@tiptap/extension-bold';
import Heading from '@tiptap/extension-heading';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold as BoldIcon, Italic as ItalicIcon, Link as LinkIcon, Type, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DescriptionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (content: string) => void;
	initialContent?: string;
}

interface LinkModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (url: string) => void;
	initialUrl?: string;
}

// Link creation helper modal
function LinkModal({ isOpen, onClose, onSave, initialUrl = '' }: LinkModalProps) {
	const [url, setUrl] = useState(initialUrl);
	const [error, setError] = useState('');

	useEffect(() => {
		if (isOpen) {
			setUrl(initialUrl);
			setError('');
		}
	}, [isOpen, initialUrl]);

	const validateUrl = (inputUrl: string) => {
		if (!inputUrl.trim()) return false;
		try {
			// Add protocol if missing
			const urlToValidate = inputUrl.includes('://') ? inputUrl : `https://${inputUrl}`;
			new URL(urlToValidate);
			return true;
		} catch {
			return false;
		}
	};

	const handleSave = () => {
		if (!url.trim()) {
			setError('Please enter a URL');
			return;
		}

		if (!validateUrl(url)) {
			setError('Please enter a valid URL');
			return;
		}

		// Add protocol if missing
		const finalUrl = url.includes('://') ? url : `https://${url}`;
		onSave(finalUrl);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4'>
			<div className='w-full max-w-sm rounded-2xl bg-white p-6'>
				<div className='mb-4 flex items-center justify-between'>
					<h3 className='text-lg font-semibold'>Add Link</h3>
					<button onClick={onClose} className='rounded-full p-1 hover:bg-gray-100'>
						<X className='h-4 w-4' />
					</button>
				</div>

				<div className='space-y-4'>
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>URL</label>
						<input
							type='text'
							value={url}
							onChange={(e) => {
								setUrl(e.target.value);
								setError('');
							}}
							placeholder='Enter URL (e.g., example.com)'
							className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500'
							autoFocus
						/>
						{error && <p className='mt-1 text-sm text-red-500'>{error}</p>}
					</div>

					<div className='flex gap-2'>
						<button
							onClick={onClose}
							className='flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50'
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className='flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
						>
							Add Link
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function DescriptionModal({
	isOpen,
	onClose,
	onSave,
	initialContent = '',
}: DescriptionModalProps) {
	const [showLinkModal, setShowLinkModal] = useState(false);
	const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				// Disable default extensions we're replacing
				bold: false,
				italic: false,
				heading: false,
			}),
			Bold,
			Italic,
			Heading.configure({
				levels: [1, 2, 3],
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'text-red-600 underline',
				},
			}),
		],
		content: initialContent,
		immediatelyRender: false, // Prevent SSR hydration issues
		shouldRerenderOnTransaction: false, // Improve performance
		editorProps: {
			attributes: {
				class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3 min-h-[200px]',
			},
		},
	});

	// Prevent body scroll and enable VirtualKeyboard API when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';

			// Enable VirtualKeyboard API for modern browsers
			if ('virtualKeyboard' in navigator && (navigator as any).virtualKeyboard) {
				(navigator as any).virtualKeyboard.overlaysContent = true;
			}
		} else {
			document.body.style.overflow = 'unset';

			// Reset VirtualKeyboard API when modal closes
			if ('virtualKeyboard' in navigator && (navigator as any).virtualKeyboard) {
				(navigator as any).virtualKeyboard.overlaysContent = false;
			}
		}

		return () => {
			document.body.style.overflow = 'unset';

			// Cleanup VirtualKeyboard API
			if ('virtualKeyboard' in navigator && (navigator as any).virtualKeyboard) {
				(navigator as any).virtualKeyboard.overlaysContent = false;
			}
		};
	}, [isOpen]);

	// Update content when modal opens
	useEffect(() => {
		if (isOpen && editor && initialContent !== editor.getHTML()) {
			editor.commands.setContent(initialContent);
		}
	}, [isOpen, initialContent, editor]);

	const handleSave = () => {
		if (editor) {
			const content = editor.getHTML();
			onSave(content);
		}
		onClose();
	};

	const handleAddLink = () => {
		if (!editor) return;

		const previousUrl = editor.getAttributes('link').href;
		setShowLinkModal(true);
	};

	const handleLinkSave = (url: string) => {
		if (!editor) return;

		const { from, to } = editor.state.selection;
		const text = editor.state.doc.textBetween(from, to);

		if (text) {
			// Selection exists, make it a link
			editor.chain().focus().setLink({ href: url }).run();
		} else {
			// No selection, insert link with URL as text
			editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
		}
	};

	const handleHeadingSelect = (level: 1 | 2 | 3) => {
		editor?.chain().focus().toggleHeading({ level }).run();
		setShowHeadingDropdown(false);
	};

	if (!isOpen) return null;

	const isActive = (name: string, attributes?: any) => {
		return editor?.isActive(name, attributes) || false;
	};

	return (
		<>
			<div className='fixed inset-0 z-50 bg-white'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-gray-200 p-4'>
					<button onClick={onClose} className='font-medium text-red-500'>
						Cancel
					</button>
					<h1 className='text-lg font-semibold'>Edit Description</h1>
					<button onClick={handleSave} className='font-medium text-red-500'>
						Save
					</button>
				</div>

				{/* Editor Content */}
				<div className='flex-1 overflow-y-auto pb-16'>
					<EditorContent editor={editor} className='h-full' />
				</div>

				{/* Fixed Bottom Toolbar */}
				<div
					className='fixed left-0 right-0 border-t border-gray-200 bg-white p-3'
					style={{
						bottom: 'calc(0px + env(keyboard-inset-height, 0px))',
					}}
				>
					<div className='mx-auto flex max-w-sm items-center justify-center gap-1'>
						{/* Bold */}
						<button
							onClick={() => editor?.chain().focus().toggleBold().run()}
							className={`rounded-lg p-3 transition-colors ${
								isActive('bold') ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							<BoldIcon className='h-5 w-5' />
						</button>

						{/* Italic */}
						<button
							onClick={() => editor?.chain().focus().toggleItalic().run()}
							className={`rounded-lg p-3 transition-colors ${
								isActive('italic') ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							<ItalicIcon className='h-5 w-5' />
						</button>

						{/* Heading Dropdown */}
						<div className='relative'>
							<button
								onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
								className={`rounded-lg p-3 transition-colors ${
									isActive('heading')
										? 'bg-red-100 text-red-600'
										: 'text-gray-600 hover:bg-gray-100'
								}`}
							>
								<Type className='h-5 w-5' />
							</button>

							{showHeadingDropdown && (
								<div className='absolute bottom-full left-0 mb-2 min-w-[120px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg'>
									<button
										onClick={() => editor?.chain().focus().setParagraph().run()}
										className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
											isActive('paragraph') ? 'bg-red-50 text-red-600' : ''
										}`}
									>
										Normal
									</button>
									<button
										onClick={() => handleHeadingSelect(1)}
										className={`w-full px-3 py-2 text-left text-lg font-bold hover:bg-gray-50 ${
											isActive('heading', { level: 1 }) ? 'bg-red-50 text-red-600' : ''
										}`}
									>
										H1
									</button>
									<button
										onClick={() => handleHeadingSelect(2)}
										className={`w-full px-3 py-2 text-left font-bold hover:bg-gray-50 ${
											isActive('heading', { level: 2 }) ? 'bg-red-50 text-red-600' : ''
										}`}
									>
										H2
									</button>
									<button
										onClick={() => handleHeadingSelect(3)}
										className={`w-full px-3 py-2 text-left text-sm font-semibold hover:bg-gray-50 ${
											isActive('heading', { level: 3 }) ? 'bg-red-50 text-red-600' : ''
										}`}
									>
										H3
									</button>
								</div>
							)}
						</div>

						{/* Link */}
						<button
							onClick={handleAddLink}
							className={`rounded-lg p-3 transition-colors ${
								isActive('link') ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							<LinkIcon className='h-5 w-5' />
						</button>
					</div>
				</div>
			</div>

			{/* Close heading dropdown when clicking outside */}
			{showHeadingDropdown && (
				<div className='fixed inset-0 z-40' onClick={() => setShowHeadingDropdown(false)} />
			)}

			{/* Link Modal */}
			<LinkModal
				isOpen={showLinkModal}
				onClose={() => setShowLinkModal(false)}
				onSave={handleLinkSave}
			/>
		</>
	);
}
