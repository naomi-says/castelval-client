import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
import { initBranding } from './branding'

initBranding() // apply the saved branding before the first paint
createRoot(document.getElementById('root')).render(<App />)
