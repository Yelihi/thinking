import type { ButtonHTMLAttributes } from 'react'

export const BaseButton = ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className="cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-white transition-all duration-200 hover:bg-blue-600 active:scale-97 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
      {...props}
    >
      {children}
    </button>
  )
}
