import React from 'react'

interface SelectProps<T> {
    options: T[];
    defaultValue: string | number;
    onChange: (value: T) => void;
    getOptionLabel?: (option: T) => string | number;
    getOptionValue?: (option: T) => string | number;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    id?: string;
}

const Select = <T,>({
    options,
    defaultValue,
    onChange,
    getOptionLabel,
    getOptionValue,
    ...rest
}: SelectProps<T>) => {

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIndex = e.target.selectedIndex;
        onChange(options[selectedIndex]); // 선택된 원래 객체/값을 부모에게 그대로 전달!
    };

    return (
        <select
            defaultValue={defaultValue}
            onChange={handleSelectChange}
            {...rest}
        >
            {options.map((option, index) => {
                // 객체일 경우 지정된 파서나 value 필드를 찾고, 아니면 그대로 문자열화
                const val = getOptionValue ? getOptionValue(option) : (typeof option === 'object' && option !== null && 'value' in option ? (option as any).value : String(option));
                const label = getOptionLabel ? getOptionLabel(option) : (typeof option === 'object' && option !== null && 'label' in option ? (option as any).label : String(option));

                return (
                    <option key={index} value={val}>
                        {label}
                    </option>
                );
            })}
        </select>
    )
}

export default React.memo(Select) as <T,>(props: SelectProps<T>) => React.ReactElement;
