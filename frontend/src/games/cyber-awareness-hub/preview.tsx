import { createRoot } from 'react-dom/client';
import { game } from './index';
// Local development entry, never registered as a mission or connected to score APIs.
const Component = game.component;
createRoot(document.getElementById('root')!).render(<Component mission={{ id: 'preview', slug: game.slug, title: 'Phishing Detective', description: 'Aperçu local', maxScore: 100, releaseState: 'PUBLISHED' }} onComplete={result => { window.alert(`Aperçu local : ${result.score}/100. Aucun score envoyé au serveur.`); }} />);
