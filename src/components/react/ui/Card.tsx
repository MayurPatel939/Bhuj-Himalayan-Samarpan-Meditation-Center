import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'subtle';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-gray-100 shadow-sm rounded-xl',
    glass: 'bg-white/90 backdrop-blur-md border border-gray-100/80 shadow-md rounded-xl',
    subtle: 'bg-[#FFF9F3] border border-[#FDEED9] rounded-xl',
  };

  return (
    <div className={twMerge(clsx(variants[variant], 'p-5 transition-all', className))} {...props}>
      {children}
    </div>
  );
};
