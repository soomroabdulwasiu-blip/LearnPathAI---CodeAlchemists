import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  onComplete?: (code: string) => void;
  isError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  onComplete,
  isError = false,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  useEffect(() => {
    const firstEmpty = digits.findIndex((d) => !d);
    const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
    if (!disabled && inputsRef.current[targetIdx]) {
      inputsRef.current[targetIdx]?.focus();
    }
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const newDigits = [...digits];
      newDigits[idx] = '';
      const combined = newDigits.join('');
      onChange(combined);
      return;
    }

    const char = val.slice(-1);
    const newDigits = [...digits];
    newDigits[idx] = char;
    const combined = newDigits.join('');
    onChange(combined);
    if (combined.length === length && onComplete) {
      onComplete(combined);
    }

    if (idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasteData) return;
    onChange(pasteData);
    if (pasteData.length === length && onComplete) {
      onComplete(pasteData);
    }
    const nextIdx = Math.min(pasteData.length, length - 1);
    inputsRef.current[nextIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-2" onPaste={handlePaste}>
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          aria-label={`Digit ${idx + 1}`}
          className={`w-10 sm:w-12 h-12 sm:h-14 text-center font-mono font-bold text-lg sm:text-xl rounded-xl transition-all outline-none ${
            isError
              ? 'border-2 border-rose-500 bg-rose-500/10 text-rose-500'
              : digit
              ? 'border-2 border-[#2D5BFF] bg-[var(--surface-muted)] text-[var(--ink)] shadow-xs'
              : 'border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--ink)] hover:border-[var(--muted)] focus:border-[#2D5BFF] focus:ring-2 focus:ring-[#2D5BFF]/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      ))}
    </div>
  );
};
