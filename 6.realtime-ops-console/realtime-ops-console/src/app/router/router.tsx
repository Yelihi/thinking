import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// route
import { OperationsConsolePage } from '@/views/operation-console'

const router = createBrowserRouter([
    {
        path: '/',
        element: <main>main</main>
    },
    {
        path: '/dashboard',
        element: <OperationsConsolePage />
    }
])

export const Router = () => {
    return <RouterProvider router={router} />
}