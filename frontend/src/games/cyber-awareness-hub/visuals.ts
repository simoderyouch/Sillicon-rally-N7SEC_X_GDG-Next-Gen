import type { Scenario } from './scenarios';
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
const colors: Record<string, string> = { 'Microsoft 365': '#1565c0', Microsoft: '#1565c0', Google: '#4285f4', GitHub: '#24292f', Amazon: '#b86800', PayPal: '#003087', LinkedIn: '#0a66c2', 'Banque Horizon': '#20665b', 'Université Lumière': '#69429e', Chronopost: '#095c99', 'Studio Campus': '#945d44' };
function wrap(text: string, length = 78) {
  const lines: string[] = []; let line = '';
  for (const word of text.split(' ')) { if ((line + word).length > length) { lines.push(line); line = ''; } line += `${word} `; }
  if (line) lines.push(line.trim()); return lines;
}
// Vector screenshots keep every character sharp at any zoom, without external image requests.
export function screenshot(s: Scenario): string {
  const color = colors[s.brand] ?? '#285e76';
  const text = (x: number, y: number, value: string, size = 16, fill = '#243042', weight = '400') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}">${escape(value)}</text>`;
  let content = `<rect width="1000" height="690" rx="12" fill="#f3f5f8"/><rect width="1000" height="48" fill="#e5e9ef"/>${text(24, 30, s.category === 'email' ? '✉  Courrier    /    Boîte de réception' : '◉  Navigateur · simulation locale', 15)}`;
  if (s.category === 'email') {
    content += `<rect x="20" y="65" width="960" height="605" rx="8" fill="white"/>${text(48, 104, s.title, 25, '#192534', '600')}${text(48, 144, s.sender, 16)}${text(48, 174, 'À : Camille Martin <camille@campus.example>  ·  23 oct. 2026, 09:20', 14, '#596579')}<path d="M48 195H952" stroke="#e4e8ef"/>`;
    // Each service has its own stationery; appearance never depends on the verdict.
    switch (s.brand) {
      case 'Microsoft 365':
        content += ['#f25022', '#7fba00', '#00a4ef', '#ffb900'].map((c, i) => `<rect x="${68 + (i % 2) * 16}" y="${218 + Math.floor(i / 2) * 16}" width="14" height="14" fill="${c}"/>`).join('') + text(112, 244, s.brand, 25, '#505050'); break;
      case 'Google':
        content += `<rect x="48" y="210" width="904" height="55" rx="12" fill="#f1f5fe"/>${text(68, 245, 'G', 30, color, '600')}${text(116, 243, 'Compte Google · Sécurité', 22, '#404753')}`; break;
      case 'GitHub':
        content += `<rect x="48" y="210" width="904" height="54" rx="6" fill="#24292f"/>${text(68, 244, 'GitHub  /  Organizations', 24, '#ffffff', '600')}`; break;
      case 'Amazon':
        content += `<rect x="48" y="210" width="904" height="55" fill="#232f3e"/>${text(68, 244, 'amazon business', 27, '#ffffff', '600')}<path d="M68 255H290" stroke="#ff9900" stroke-width="3"/>${text(755, 244, 'FACTURE', 17, '#ffcc80')}`; break;
      case 'PayPal':
        content += `${text(68, 244, 'PayPal', 31, color, '700')}${text(742, 244, '24,00 EUR', 22, color)}`; break;
      case 'LinkedIn':
        content += `<rect x="48" y="212" width="42" height="42" rx="4" fill="${color}"/>${text(56, 244, 'in', 30, '#ffffff', '700')}${text(108, 244, 'LinkedIn · Emplois', 25, color)}`; break;
      case 'Banque Horizon':
        content += `<path d="M48 264H952" stroke="${color}" stroke-width="3"/>${text(68, 242, 'BH  |  Banque Horizon', 26, color, '600')}${text(700, 242, 'VOS DOCUMENTS', 15, color)}`; break;
      case 'Université Lumière':
        content += `<rect x="48" y="210" width="904" height="55" fill="#f3eff9"/>${text(68, 244, 'UL  /  Université Lumière', 25, color, '600')}${text(736, 244, 'VIE ÉTUDIANTE', 14, color)}`; break;
      case 'Chronopost':
        content += `<rect x="48" y="210" width="904" height="55" fill="#edf5fa"/>${text(68, 244, 'chronopost', 30, color, '700')}${text(724, 244, 'SUIVI DE COLIS', 16, color)}`; break;
      default:
        content += `${text(68, 244, 'Studio Campus', 27, color, '600')}${text(714, 244, 'Design & impression', 15, '#66717e')}<path d="M48 264H952" stroke="#d9c6ba"/>`;
    }
    let y = 294;
    for (const paragraph of s.body) { for (const line of wrap(paragraph)) { content += text(68, y, line, 18); y += 26; } y += 12; }
    content += `<rect x="68" y="${Math.min(y + 2, 580)}" width="340" height="44" rx="5" fill="${color}"/>${text(86, Math.min(y + 30, 608), s.action, 17, 'white', '600')}${text(68, 648, 'Message reçu • Les détails et liens sont accessibles dans le panneau d’inspection.', 13, '#647084')}`;
  } else {
    let y = 78;
    for (let i = 0; i < s.url.length; i += 105) { content += text(24, y, s.url.slice(i, i + 105), 14); y += 20; }
    content += `<path d="M0 ${y + 5}H1000" stroke="#cdd5df"/><rect x="260" y="190" width="480" height="440" rx="${s.brand === 'Google' ? 24 : 6}" fill="white" stroke="#d9e0ea"/>${text(300, 244, s.brand, 28, color, '600')}${text(300, 287, s.category === 'login' ? s.title : 'Document partagé', 22, '#1c2838', '600')}`;
    if (s.category === 'login') content += `${text(300, 333, 'Adresse e-mail', 14, '#596579')}<rect x="300" y="345" width="400" height="46" rx="4" fill="#fafbfc" stroke="#98a5b5"/>${text(312, 375, 'camille@campus.example', 16, '#6b7583')}${text(300, 420, 'Mot de passe', 14, '#596579')}<rect x="300" y="433" width="400" height="46" rx="4" fill="#fafbfc" stroke="#98a5b5"/>${text(312, 464, '••••••••••••', 18, '#6b7583')}${text(300, 509, 'Mot de passe oublié ?', 14, color)}`;
    else {
      content += text(300, 330, 'Lien reçu dans la conversation :', 15, '#596579');
      wrap(s.title, 36).forEach((line, i) => { content += text(300, 366 + i * 25, line, 17, color, '600'); });
      content += `${text(300, 450, 'Préparation de la journée d’intégration', 16, '#596579')}${text(300, 488, 'Camille Martin · accès à la ressource', 15, '#596579')}`;
    }
    content += `<rect x="300" y="538" width="400" height="44" rx="5" fill="${color}"/>${text(324, 567, s.category === 'login' ? 'Se connecter' : s.action, 17, 'white', '600')}${text(300, 610, 'Aide   ·   Confidentialité   ·   Conditions', 13, '#596579')}`;
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="690" viewBox="0 0 1000 690" font-family="Arial, sans-serif">${content}</svg>`)}`;
}
