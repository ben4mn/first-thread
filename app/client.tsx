import { createRoot } from 'react-dom/client';
import Workshop from './workshop';
import './globals.css';
const root = document.getElementById('root');
if (!root) throw new Error('The workshop mount point is missing.');
createRoot(root).render(<Workshop />);
