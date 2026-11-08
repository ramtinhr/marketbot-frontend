'use client';

import { OTPInput } from 'input-otp';
import { ui } from '@/lib/ui-styles';
import { digits } from '@/lib/format';

export function VerificationCodeInput({
  value,
  onChange,
  disabled = false,
  invalid = false,
  describedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <OTPInput
      containerClassName="otp-input"
      dir="ltr"
      aria-label="کد تأیید ۶ رقمی"
      aria-invalid={invalid}
      aria-describedby={describedBy}
      inputMode="numeric"
      autoComplete="one-time-code"
      required
      autoFocus
      disabled={disabled}
      maxLength={6}
      minLength={6}
      pattern="[0-9۰-۹٠-٩]*"
      value={value}
      onChange={(next) => onChange(digits(next))}
      pasteTransformer={(next) => digits(next).replace(/[^0-9]/g, '')}
      render={({ slots }) => (
        <div
          data-ui="otp-slots"
          className="grid [grid-template-columns:repeat(6,_minmax(0,_1fr))] [gap:clamp(6px,_2vw,_12px)] [width:100%]"
          dir="ltr"
          aria-hidden="true"
        >
          {slots.map((slot, index) => (
            <div
              key={index}
              {...ui(`otp-slot${slot.isActive ? ' active' : ''}${invalid ? ' invalid' : ''}`)}
            >
              {slot.char}
              {slot.hasFakeCaret && (
                <span
                  data-ui="otp-caret"
                  className="absolute [width:2px] [height:26px] [background:var(--accent)] [animation:otp-blink_1s_step-end_infinite] [@media(prefers-reduced-motion:_reduce)]:[animation:none]"
                />
              )}
            </div>
          ))}
        </div>
      )}
    />
  );
}
