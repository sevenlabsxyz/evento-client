'use client';

import React from 'react';

// GIPHY logo icon component
const GiphyIcon = ({ className = '', ...props }: React.SVGProps<SVGSVGElement>) => (
	<svg
		viewBox='0 0 28 10'
		fill='currentColor'
		xmlns='http://www.w3.org/2000/svg'
		className={className}
		{...props}
	>
		<path d='M0 4.5V0h1v4.5z' />
		<path d='M2.5 0h-1v5h1V3h1.5v2h1V0h-1v2.5h-1.5zM7.5 0v5h1V0zM10.5 0v5h3.5v-1h-2.5V0zM16 0v1h2v3h1V0zM20.5 0v5h1V0zM24 0v5h1V3h1.5v2h1V0h-1v2.5h-1.5V0z' />
		<path d='M0 10v-4h1v4z' />
		<path d='M2.5 5.5v5h1v-2h1.5v1.5h1V5.5zM7.5 10v-5h1v5zM10.5 5.5v5h3.5V9.5h-2.5v-1h1.5V8h-1.5V7h1.5V5.5zM16 6v4h3.5V9h-2.5v-1h1.5V7h-1.5V6zM22 5.5v5h1v-2h1.5v2h1v-5h-1v2h-1.5v-2z' />
	</svg>
);

export default GiphyIcon;
