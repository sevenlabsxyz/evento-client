interface OnboardingHeaderProps {
  title: string;
  description?: string;
}

export const OnboardingHeader = ({ title, description }: OnboardingHeaderProps) => {
  return (
    <div className='flex flex-col items-start gap-1 md:items-center'>
      <h2 className='text-2xl font-bold md:text-2xl'>{title}</h2>
      {description && (
        <div className='text-left text-base text-gray-500 md:max-w-md md:text-center md:text-sm'>
          {description}
        </div>
      )}
    </div>
  );
};
