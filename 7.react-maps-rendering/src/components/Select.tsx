import React from "react";

interface SelectProps<T> {
  options: T[];
  value: string | number;
  onChange: (value: T) => void;
  getOptionLabel?: (option: T) => string | number;
  getOptionValue?: (option: T) => string | number;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  id?: string;
}

function hasField<TField extends string>(
  option: unknown,
  field: TField,
): option is Record<TField, string | number> {
  return typeof option === "object" && option !== null && field in option;
}

const Select = <T,>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
  ...rest
}: SelectProps<T>) => {
  const getValue = (option: T) => {
    if (getOptionValue) {
      return getOptionValue(option);
    }

    if (hasField(option, "value")) {
      return option.value;
    }

    return String(option);
  };

  const getLabel = (option: T) => {
    if (getOptionLabel) {
      return getOptionLabel(option);
    }

    if (hasField(option, "label")) {
      return option.label;
    }

    return String(option);
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value;
    const selectedOption = options.find((option) => String(getValue(option)) === nextValue);

    if (selectedOption !== undefined) {
      onChange(selectedOption);
    }
  };

  return (
    <select value={value} onChange={handleSelectChange} {...rest}>
      {options.map((option) => {
        const optionValue = getValue(option);

        return (
          <option key={String(optionValue)} value={optionValue}>
            {getLabel(option)}
          </option>
        );
      })}
    </select>
  );
};

export default React.memo(Select) as <T,>(props: SelectProps<T>) => React.ReactElement;
