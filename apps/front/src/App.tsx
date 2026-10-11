import { RouterProvider } from 'react-router'
import ServiceProvider from './app/providers/ServiceProvider'
import { router } from './app/router'

function App() {
  return (
    <ServiceProvider>
      <RouterProvider router={router} />
    </ServiceProvider>
  )
}

export default App
