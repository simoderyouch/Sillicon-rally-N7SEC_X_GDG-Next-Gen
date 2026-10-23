import { createRoot } from 'react-dom/client';
import { game } from './index';
const Component = game.component;
createRoot(document.getElementById('root')!).render(<Component mission={{ id: 'word-scramble-preview', slug: game.slug, title: 'Cyber Word Scramble', description: 'Aperçu local', maxScore: 100, releaseState: 'PUBLISHED' }} onComplete={result => { window.alert(`Aperçu local : ${result.score}/100. Aucun score envoyé au serveur.`); }} />);
