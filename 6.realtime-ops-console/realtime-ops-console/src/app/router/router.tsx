import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// route
import { OperationConsole } from '@/views/operation-console'

const router = createBrowserRouter([
    {
        path: '/',
        element: <main>main</main>
    },
    {
        path: '/dashboard',
        element: <OperationConsole />
    }
])

export const Router = () => {
    return <RouterProvider router={router} />
}