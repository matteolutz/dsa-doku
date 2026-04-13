import type { FC } from 'react';

import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export type BottomNavItem = {
  label: string;
  icon: IconSvgElement;
  value: string;
  disabled?: boolean;
};

export type BottomNavProps = {
  items: BottomNavItem[];
  activeTab: string;
  onActiveTabChange: (value: string) => void;
};

export const BottomNav: FC<BottomNavProps> = ({
  items,
  activeTab,
  onActiveTabChange
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-card">
      <nav
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`
        }}
      >
        {items.map((item) => {
          const isActive = activeTab === item.value;

          return (
            <button
              disabled={item.disabled}
              key={item.value}
              onClick={() => onActiveTabChange(item.value)}
              className={cn(
                'relative flex flex-col items-center gap-1 py-2 transition-colors',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* ✅ Animated Indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 35
                  }}
                />
              )}

              {/* Icon */}
              <motion.span
                animate={{
                  scale: isActive ? 1.1 : 1
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20
                }}
                className={cn(
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  className="size-5"
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </motion.span>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* bottom safe-area spacer */}
      <div className="h-2" />
    </div>
  );
};
