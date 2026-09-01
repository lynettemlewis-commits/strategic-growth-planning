import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from './input';

interface InputWithControlsProps {
  label: string;
  placeholder: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
  currentLabel: string;
  testId: string;
}

export const InputWithControls: React.FC<InputWithControlsProps> = ({
  label,
  placeholder,
  value,
  step,
  onChange,
  currentLabel,
  testId
}) => {
  const [localValue, setLocalValue] = React.useState<string>('');
  const [isFocused, setIsFocused] = React.useState(false);

  // Update local value when prop value changes (but not when focused)
  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(value === 0 ? '' : value.toString());
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Remove commas for parsing
    const cleanValue = inputValue.replace(/,/g, '');
    setLocalValue(inputValue);
    
    // Handle empty input
    if (cleanValue === '') {
      onChange(0);
      return;
    }
    
    // Allow decimal point at start or end during typing
    if (cleanValue === '.' || cleanValue === '-' || cleanValue.endsWith('.')) {
      // Don't update the onChange yet, just allow the typing
      return;
    }
    
    // Handle starting with decimal point
    let valueToParse = cleanValue;
    if (cleanValue.startsWith('.')) {
      valueToParse = '0' + cleanValue;
    }
    
    const newValue = parseFloat(valueToParse);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value === 0 ? '' : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Ensure we have a valid number on blur
    const finalValue = parseFloat(localValue) || 0;
    onChange(finalValue);
  };

  const increment = () => {
    const newValue = parseFloat((value + step).toFixed(step < 1 ? 2 : 0));
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = parseFloat((value - step).toFixed(step < 1 ? 2 : 0));
    onChange(newValue);
  };

  const formatNumberWithCommas = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const displayValue = isFocused ? localValue : (value === 0 ? '' : formatNumberWithCommas(value));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full p-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder={placeholder}
          data-testid={testId}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
          <button
            type="button"
            onClick={increment}
            className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-sm flex items-center justify-center text-xs transition-colors"
            data-testid={`button-${testId}-increment`}
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={decrement}
            className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-sm flex items-center justify-center text-xs transition-colors"
            data-testid={`button-${testId}-decrement`}
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {currentLabel}
      </p>
    </div>
  );
};
