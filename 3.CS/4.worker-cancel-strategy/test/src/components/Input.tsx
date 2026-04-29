import styles from "./Input.module.css"

/**
 * 제어 컴포넌트로 진행할 예정
 */
export function Input({ value, onChange, ...props }: React.ComponentProps<'input'>) {
    return <div className={styles.container}>
        <input className={styles.input} value={value} onChange={onChange} {...props} />
    </div>
}