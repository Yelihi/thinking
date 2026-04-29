import styles from "./Button.module.css"


export function Button({ children, onClick, color, ...props }: React.ComponentProps<'button'> & { color: 'primary' | 'secondary' }) {
    return <button style={{
        backgroundColor: color === 'primary' ? 'black' : 'white',
        color: color === 'primary' ? 'white' : 'black'
    }} className={styles.button} onClick={onClick} {...props}>{children}</button>
}