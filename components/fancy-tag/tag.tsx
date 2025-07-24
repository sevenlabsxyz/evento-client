'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface TagProps {
	text: string;
	isSelected: boolean;
	onToggle: () => void;
}

export function Tag({ text, isSelected, onToggle }: TagProps) {
	return (
		<motion.button
			onClick={onToggle}
			layout
			initial={false}
			animate={{
				backgroundColor: isSelected ? '#fef2f2' : 'rgba(229, 231, 235, 0.5)',
			}}
			whileHover={{
				backgroundColor: isSelected ? '#fef2f2' : 'rgba(229, 231, 235, 0.8)',
			}}
			whileTap={{
				backgroundColor: isSelected ? '#fee2e2' : 'rgba(229, 231, 235, 0.9)',
			}}
			transition={{
				type: 'spring',
				stiffness: 500,
				damping: 30,
				mass: 0.5,
				backgroundColor: { duration: 0.1 },
			}}
			className={`inline-flex items-center overflow-hidden whitespace-nowrap rounded-full px-4 py-2 text-base font-medium ring-1 ring-inset ${isSelected ? 'text-red-600 ring-[rgba(0,0,0,0.12)]' : 'text-gray-600 ring-[rgba(0,0,0,0.06)]'} `}
		>
			<motion.div
				className='relative flex items-center'
				animate={{
					width: isSelected ? 'auto' : '100%',
					paddingRight: isSelected ? '1.5rem' : '0',
				}}
				transition={{
					ease: [0.175, 0.885, 0.32, 1.275],
					duration: 0.3,
				}}
			>
				<span>{text}</span>
				<AnimatePresence>
					{isSelected && (
						<motion.span
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0, opacity: 0 }}
							transition={{
								type: 'spring',
								stiffness: 500,
								damping: 30,
								mass: 0.5,
							}}
							className='absolute right-0'
						>
							<div className='flex h-4 w-4 items-center justify-center rounded-full bg-red-600'>
								<Check className='h-3 w-3 text-white' strokeWidth={1.5} />
							</div>
						</motion.span>
					)}
				</AnimatePresence>
			</motion.div>
		</motion.button>
	);
}
