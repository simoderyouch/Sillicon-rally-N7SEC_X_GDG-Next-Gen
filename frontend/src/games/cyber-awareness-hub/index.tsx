import { useRef, useState } from 'react';
import type { GameDefinition, GameProps } from '../types';
import { shuffledStages, type Scenario } from './scenarios';
import { screenshot } from './visuals';
import './style.css';

const names = { email: 'Enquête sur les e-mails', url: 'Investigation des URL', login: 'Pages de connexion' };
function Evidence({ item }: { item: Scenario }) {
  return <details className="pd-inspect"><summary>Inspecter les détails techniques</summary><dl>
    {item.sender && <><dt>Expéditeur affiché</dt><dd>{item.sender}</dd><dt>Reply-To</dt><dd>{item.replyTo}</dd></>}
    <dt>Texte du lien / bouton</dt><dd>{item.category === 'url' ? item.title : item.action}</dd>
    <dt>{item.category === 'login' ? 'URL complète de la page' : 'Destination réelle (après redirection éventuelle)'}</dt><dd><code>{item.url}</code></dd>
    <dt>Contexte disponible</dt><dd>{item.context}</dd>
    <dt>Transcription accessible du visuel</dt><dd>{item.brand} — {item.title}{item.category === 'email' ? <><p>À : Camille Martin &lt;camille@campus.example&gt; · 23 octobre 2026, 09:20</p>{item.body.map(line => <p key={line}>{line}</p>)}</> : <p>{item.category === 'login' ? 'Formulaire simulé : adresse e-mail, mot de passe, connexion, récupération du mot de passe.' : 'Document partagé : planning et ressources de l’équipe.'}</p>}</dd>
  </dl></details>;
}
function Game({ mission, onComplete, disabled = false }: GameProps) {
  const [items] = useState(shuffledStages);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const answerGuard = useRef(false);
  const handoffGuard = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const finished = answers.length === items.length && !locked;
  const current = items[Math.min(answers.length - (locked ? 1 : 0), items.length - 1)];
  const correct = answers.reduce((total, answer, i) => total + Number(answer === items[i].phishing), 0);
  const score = Math.round(correct / items.length * 100);
  const stageItems = items.filter(item => item.category === current.category);
  const stageNumber = stageItems.findIndex(item => item.id === current.id) + 1;
  function record() {
    if (choice === null || disabled || answerGuard.current) return;
    answerGuard.current = true; setAnswers(previous => [...previous, choice]); setLocked(true);
  }
  function next() {
    setLocked(false); setChoice(null); answerGuard.current = false;
    requestAnimationFrame(() => heading.current?.focus());
  }
  function submit() {
    if (disabled || handoffGuard.current) return;
    handoffGuard.current = true; setSubmitted(true);
    onComplete({ score: Math.min(score, mission.maxScore), completed: true, details: { correct, total: items.length, accuracy: score, rawScore: score } });
  }
  const image = (item: Scenario) => <img src={screenshot(item)} alt={`Simulation ${item.brand} : ${item.title}. Transcription dans les détails techniques.`} />;
  return <section className="pd-game" aria-label="Phishing Detective">
    <div className="pd-top"><span>CYBER AWARENESS LAB</span><span>12 dossiers · 100 points</span></div>
    {!started ? <div className="pd-welcome"><span className="pd-badge">ENQUÊTE NUMÉRIQUE / 01</span><h1>Phishing Detective <span>— Can You Spot the Threat?</span></h1><p>Un logo familier. Un message crédible. Un détail qui change tout.</p><p>Analysez 12 scénarios réalistes : 6 e-mails, 3 liens et 3 pages de connexion. Inspectez les adresses et le contexte avant de décider.</p><div className="pd-stages"><div><b>01 / E-mails</b><span>50 points</span></div><div><b>02 / URL</b><span>25 points</span></div><div><b>03 / Connexions</b><span>25 points</span></div></div><p>Chaque réponse devient définitive à la validation. Le score est le pourcentage de bonnes réponses, arrondi sur 100. Le corrigé complet apparaît à la fin. Les interfaces sont des simulations : aucun lien externe ni saisie d’identifiants.</p><button disabled={disabled} onClick={() => setStarted(true)}>Commencer l’enquête →</button></div>
    : finished ? <><div className="pd-results"><span className="pd-badge">ENQUÊTE TERMINÉE</span><h2 ref={heading} tabIndex={-1}>Votre rapport d’analyse</h2><div className="pd-stages"><div><b>{score}/100</b><span>Score</span></div><div><b>{correct}/{items.length}</b><span>Réponses correctes</span></div><div><b>{score}%</b><span>Précision</span></div></div><p>Consultez les indices ci-dessous avant de transmettre votre résultat.</p>{mission.maxScore !== 100 && <p>Le plafond de cette mission est {mission.maxScore} points : le score transmis sera plafonné.</p>}<button onClick={submit} disabled={disabled || submitted}>{disabled ? 'Envoi en cours…' : submitted ? 'Résultat transmis' : 'Transmettre mon score'}</button>{submitted && !disabled && <button onClick={() => { handoffGuard.current = false; setSubmitted(false); }}>Réactiver l’envoi si la plateforme signale un échec</button>}</div><div className="pd-review">{items.map((item, i) => <details key={item.id}><summary>{String(i + 1).padStart(2, '0')} · {item.brand} — {item.title} · {answers[i] === item.phishing ? 'Correct' : 'À revoir'}</summary>{image(item)}<p>Votre réponse : <b>{answers[i] ? 'Phishing / suspect' : 'Légitime'}</b> · Réponse attendue : <b>{item.phishing ? 'Phishing / suspect' : 'Légitime'}</b></p><p className="pd-evidence">{item.evidence}</p><p>{item.advice}</p><Evidence item={item} /></details>)}</div></>
    : <><div className="pd-progress"><span>Dossier {answers.length + (locked ? 0 : 1)} / {items.length}</span><progress aria-label="Progression globale" max={items.length} value={answers.length} /></div><h2 tabIndex={-1} ref={heading}>{names[current.category]} <small>{stageNumber}/{stageItems.length}</small></h2><p className="pd-context">{current.context}</p><div className="pd-workspace"><div className="pd-visual"><button className="pd-zoom" onClick={() => setZoom(true)}>Agrandir le visuel ↗</button>{image(current)}</div><aside><span className="pd-badge">VOTRE ANALYSE</span><h3>{current.category === 'email' ? 'Cet e-mail est-il légitime ?' : current.category === 'url' ? 'La destination est-elle fiable ?' : 'Cette page est-elle authentique ?'}</h3><p>Examinez le visuel et les détails techniques. Le contexte fait partie des preuves.</p><Evidence key={current.id} item={current} /><div className="pd-choices">{[true, false].map(value => <button key={String(value)} aria-pressed={choice === value} disabled={disabled || locked} onClick={() => setChoice(value)}>{value ? current.category === 'url' ? 'Destination suspecte' : 'Phishing' : 'Légitime'}</button>)}</div>{locked ? <><p role="status">Réponse enregistrée. Le corrigé sera disponible à la fin.</p><button autoFocus disabled={disabled} onClick={next}>{answers.length === items.length ? 'Voir le bilan' : 'Dossier suivant →'}</button></> : <button onClick={record} disabled={disabled || choice === null}>Valider ma réponse</button>}</aside></div></>}
    {zoom && <div className="pd-overlay" role="dialog" aria-modal="true" aria-label="Visuel agrandi" onKeyDown={event => { if (event.key === 'Escape') setZoom(false); if (event.key === 'Tab') { event.preventDefault(); } }}><button autoFocus onClick={() => setZoom(false)}>Fermer le zoom (Échap)</button><div>{image(current)}</div><p>Faites défiler pour examiner le visuel à sa taille originale.</p></div>}
  </section>;
}
export const game: GameDefinition = { slug: "cyber-awareness-hub", component: Game };
