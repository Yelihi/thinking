import React from 'react'

interface SelectProps<T> extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'onChange' | 'defaultValue'> {
    children: (options: Array<T>) => React.ReactNode;
    options: Array<T>;
    defaultValue: string | number | readonly string[] | undefined;
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}


const Select = <T,>(props: SelectProps<T>) => {
    const { options, defaultValue, onChange, children, ...rest } = props

    return (
        <select
            defaultValue={defaultValue}
            onChange={onChange}
            {...rest}
        >
            {children(options)}
        </select>
    )
}

export default Select