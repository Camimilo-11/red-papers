import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ensureSchoolLogosDecoded } from './assets/schoolLogos';
import './index.css';

// Begin every institutional image download/decode during the intro, not per school.
void ensureSchoolLogosDecoded();

createRoot(document.getElementById('root')!).render(<App />);
