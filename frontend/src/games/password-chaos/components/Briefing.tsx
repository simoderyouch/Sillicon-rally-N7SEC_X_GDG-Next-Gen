export function Briefing({ title, notice, onStart }: { title: string; notice?: string; onStart: () => void }) {
  return <section className="pc-brief">
    <p className="pc-kicker">GDG × N7SEC · Speed logic</p>
    <h2>{title}</h2>
    <p className="pc-lead">Build a password that satisfies all conditions before the timer runs out.</p>
    <ul>
      <li>20 challenges, in order: 15 HARD, then 5 EXPERT.</li>
      <li>A correct password locks the challenge and opens the next one immediately.</li>
      <li>If the timer hits zero, that challenge scores 0 and advances on its own.</li>
      <li>If every timer runs out, the session lasts 13 minutes 47 seconds.</li>
      <li>Faster valid answers earn more points. Maximum score: 100.</li>
    </ul>
    {notice && <p role="status">{notice}</p>}
    <button type="button" className="pc-primary" onClick={onStart}>Start</button>
  </section>;
}
