import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar as CalendarIcon } from '@hugeicons/core-free-icons';

import { format } from 'date-fns';
import type { FC } from 'react';

export type DatePickerProps = {
  value?: Date;
  onChange?: (value: Date | undefined) => void;
  triggerId?: string;
};

export const DatePicker: FC<DatePickerProps> = ({
  value,
  onChange,
  triggerId
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger id={triggerId} asChild>
        <Button
          variant="outline"
          id="date"
          className="justify-start font-normal"
        >
          {value ? value.toLocaleDateString() : 'Select date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          captionLayout="dropdown"
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export type DatePickerWithRangeProps = {
  value?: { startDate: Date; endDate: Date };
  onChange?: (value: { startDate?: Date; endDate?: Date } | undefined) => void;
  triggerId?: string;
};

export const DatePickerWithRange: FC<DatePickerWithRangeProps> = ({
  value,
  onChange,
  triggerId
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={triggerId}
          className="justify-start px-2.5 font-normal"
        >
          <HugeiconsIcon icon={CalendarIcon} />
          {value?.startDate ? (
            value.endDate ? (
              <>
                {format(value.startDate, 'LLL dd, y')} -{' '}
                {format(value.endDate, 'LLL dd, y')}
              </>
            ) : (
              format(value.startDate, 'LLL dd, y')
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.startDate}
          selected={{ from: value?.startDate, to: value?.endDate }}
          onSelect={(range) => {
            if (!range) return onChange?.(undefined);
            onChange?.({ startDate: range.from, endDate: range.to });
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
};
