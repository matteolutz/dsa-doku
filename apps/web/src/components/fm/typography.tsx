import { cn } from '@/lib/utils';
import { forwardRef, type HTMLProps } from 'react';

export const TypographyH1 = forwardRef<
  HTMLHeadingElement,
  HTMLProps<HTMLHeadingElement>
>((props, ref) => (
  <h1
    ref={ref}
    {...props}
    className={cn(
      'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
      props.className
    )}
  />
));
TypographyH1.displayName = 'TypographyH1';

export const TypographyH2 = forwardRef<
  HTMLHeadingElement,
  HTMLProps<HTMLHeadingElement>
>((props, ref) => (
  <h2
    ref={ref}
    {...props}
    className={cn(
      'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
      props.className
    )}
  />
));
TypographyH2.displayName = 'TypographyH2';

export const TypographyH3 = forwardRef<
  HTMLHeadingElement,
  HTMLProps<HTMLHeadingElement>
>((props, ref) => (
  <h3
    ref={ref}
    {...props}
    className={cn(
      'scroll-m-20 text-2xl font-semibold tracking-tight',
      props.className
    )}
  />
));
TypographyH3.displayName = 'TypographyH3';

export const TypographyH4 = forwardRef<
  HTMLHeadingElement,
  HTMLProps<HTMLHeadingElement>
>((props, ref) => (
  <h4
    ref={ref}
    {...props}
    className={cn(
      'scroll-m-20 text-xl font-semibold tracking-tight',
      props.className
    )}
  />
));
TypographyH4.displayName = 'TypographyH4';

export const TypographyP = forwardRef<
  HTMLParagraphElement,
  HTMLProps<HTMLParagraphElement>
>((props, ref) => (
  <p
    ref={ref}
    {...props}
    className={cn('leading-7 [&:not(:first-child)]:mt-6', props.className)}
  />
));
TypographyP.displayName = 'TypographyP';

export const TypographyMuted = forwardRef<
  HTMLParagraphElement,
  HTMLProps<HTMLParagraphElement>
>((props, ref) => (
  <p
    ref={ref}
    {...props}
    className={cn('text-sm text-muted-foreground', props.className)}
  />
));
TypographyMuted.displayName = 'TypographyMuted';
