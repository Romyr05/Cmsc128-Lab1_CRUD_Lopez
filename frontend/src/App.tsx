import './App.css'
import TasksPage from './pages/TasksPage'
import { Toaster } from '@/components/ui/sonner'

function App() {

  return (
    <>
      <TasksPage/>
      <Toaster duration={2000} />
    </>
  )
}

export default App
