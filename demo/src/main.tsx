import { createRoot } from 'react-dom/client'
import Interviewer from './Interviewer'

const params = new URLSearchParams(location.search)
const shape = params.get('shape') === 'square' ? 'square' : 'portrait'
const freeze = params.get('freeze')

createRoot(document.getElementById('root')!).render(<Interviewer shape={shape} freeze={freeze} />)
