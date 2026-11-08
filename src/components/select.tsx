'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import styles from './select.module.css';

const emptyValue = '__marketbot_empty_option__';

type SelectProps = Pick<
  ComponentProps<typeof SelectPrimitive.Trigger>,
  'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid'
> & {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  children: ReactNode;
};

export function Select({
  value,
  onValueChange,
  disabled,
  required,
  name,
  children,
  ...props
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      dir="rtl"
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
      name={name}
    >
      <SelectPrimitive.Trigger {...props} className={styles.trigger} data-ui="select-trigger">
        <span className={styles.value}>
          <SelectPrimitive.Value placeholder="انتخاب کنید" />
        </span>
        <SelectPrimitive.Icon className={styles.icon}>
          <ChevronDown size={17} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={styles.content}
          position="popper"
          sideOffset={7}
          collisionPadding={12}
        >
          <SelectPrimitive.ScrollUpButton className={styles.scroll}>
            <ChevronUp size={16} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className={styles.viewport}>
            {children}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className={styles.scroll}>
            <ChevronDown size={16} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function SelectOption({
  value,
  children,
  disabled,
}: {
  value: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <SelectPrimitive.Item
      value={value || emptyValue}
      disabled={disabled || !value}
      className={styles.option}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className={styles.check}>
        <Check size={16} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
