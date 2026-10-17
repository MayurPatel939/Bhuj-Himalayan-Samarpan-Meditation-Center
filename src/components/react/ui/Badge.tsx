import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'saffron' | 'blue' | 'sage' | 'gray' | 'danger' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  className,
  ...props
}) => {
  const variants = {
    saffron: 'bg-[#FDEED9] text-[#C2741C] border border-[#F3AA55]/30',
    blue: 'bg-[#E8F2FC] text-[#2F6DB1] border border-[#4A90D9]/30',
    sage: 'bg-[#EDF5EF] text-[#4F7959] border border-[#6B9F78]/30',
    gray: 'bg-gray-100 text-gray-700 border border-gray-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
