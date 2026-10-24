import { describe, expect, it } from 'vitest';
import { frameDocument } from './frame';

describe('local engine packaging', () => {
  it('assembles executable original engine code without external scripts or fonts', () => {
    const html = frameDocument('test-instance');
    expect(html).not.toMatch(/googletagmanager|fonts\.googleapis|<script\s+src=/);
    expect(html).toContain('Copyright (c) 2020 Brent Ward');
    expect(html).toContain('class GameCoordinator');
    expect(html).toContain('class Ghost');
    expect(html).not.toContain('module.exports');
    const script = html.match(/<script>([\s\S]*)<\/script>/)![1];
    expect(() => new Function(script)).not.toThrow();
  });
  it('resolves dynamic sprite URLs, including already resolved pickup images', () => {
    const script = frameDocument('test-instance').match(/<script>([\s\S]*)<\/script>/)![1];
    const helpers = script.slice(0, script.indexOf('class '));
    const css = new Function(`${helpers}; return assetCss;`)() as (value: string) => string;
    const result = css('url(app/style/graphics/spriteSheets/pickups/cherry.svg)');
    expect(result).toContain('cherry');
    expect(css(result)).toBe(result);
    // Upstream floating score text omits the final closing parenthesis.
    expect(css('url(app/style/graphics/spriteSheets/text/100.svg')).toMatch(/\)$/);
  });
});
