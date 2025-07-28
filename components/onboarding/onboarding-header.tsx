interface OnboardingHeaderProps {
  title: string;
  description?: string;
}

export const OnboardingHeader = ({
  title,
  description,
}: OnboardingHeaderProps) => {
  return (
    <div className='flex flex-col items-start md:items-center gap-1'>
      <h2 className='text-2xl md:text-2xl font-bold'>{title}</h2>
      {description && (
        <div className='text-left md:text-center text-base md:text-sm text-gray-500 md:max-w-md'>
          {description}
        </div>
      )}
    </div>
  );
};
