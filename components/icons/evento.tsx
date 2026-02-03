export const EventoIcon = ({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) => (
  <svg
    width='294'
    height='294'
    viewBox='0 0 294 294'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    className={className}
    onClick={onClick}
  >
    <rect width='294' height='294' rx='53.4545' fill='white' />
    <path
      d='M236.014 99.5158L251.551 138.23L183.687 157.847L226.261 207.122L188.299 231.759L145.725 179.974L105.463 231.77L66.9255 207.144L109.488 157.869L42.7637 138.263L58.2891 99.5379L123.288 121.654V58.8H169.29V121.654L236.014 99.5158Z'
      fill='black'
    />
  </svg>
);
