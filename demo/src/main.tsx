import { createRoot } from 'react-dom/client'
import Interviewer from './Interviewer'

const shape = new URLSearchParams(location.search).get('shape') === 'square' ? 'square' : 'portrait'

createRoot(document.getElementById('root')!).render(<Interviewer shape={shape} />)
