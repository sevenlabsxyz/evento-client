'use client';

import { cn } from '@/lib/utils';
import { QRCode } from 'react-qrcode-logo';

interface EventoQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  showLogo?: boolean;
}

export function EventoQRCode({ value, size = 256, className, showLogo = true }: EventoQRCodeProps) {
  return (
    <div className={cn('inline-block rounded-2xl bg-white p-4 shadow-sm', className)}>
      <QRCode
        value={value}
        size={size}
        bgColor='#FFFFFF'
        fgColor='#000000'
        qrStyle='dots'
        quietZone={10}
        logoImage={showLogo ? '/assets/img/evento-sublogo.svg' : undefined}
        logoWidth={size * 0.2}
        logoHeight={size * 0.2}
        logoOpacity={1}
        removeQrCodeBehindLogo={true}
        eyeRadius={[
          [10, 10, 0, 10], // top-left eye
          [10, 10, 10, 0], // top-right eye
          [10, 0, 10, 10], // bottom-left eye
        ]}
      />
    </div>
  );
}
