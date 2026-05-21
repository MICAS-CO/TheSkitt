/**
 * Smoke tests for the diegetic frame components — render without
 * throwing, produce SVG markup with the expected elements, and accept
 * the props from production callers.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Clipboard,
  DrugChart,
  Monitor,
  ResultsEnvelope,
  VitalsStripFrame,
} from '../src/style/frames';

describe('M19 — diegetic frames', () => {
  it('Clipboard renders SVG with metal clip + paper sheet', () => {
    const html = renderToStaticMarkup(<Clipboard label="HISTORY">notes</Clipboard>);
    expect(html).toContain('<svg');
    expect(html).toContain('paperGrain');
    expect(html).toContain('HISTORY');
    expect(html).toContain('notes');
  });

  it('Monitor renders bezel + green status LED + content slot', () => {
    const html = renderToStaticMarkup(
      <Monitor sticker="CardioVis · v3.2">portrait inside</Monitor>,
    );
    expect(html).toContain('bezelGrad');
    expect(html).toContain('CardioVis');
    // green status LED
    expect(html).toContain('#5BBF8F');
    expect(html).toContain('portrait inside');
  });

  it('VitalsStripFrame renders one tile per reading with the right tone', () => {
    const html = renderToStaticMarkup(
      <VitalsStripFrame
        vitals={[
          { label: 'HR', value: '124', unit: 'bpm', tone: '#E0A82E' },
          { label: 'BP', value: '88/52', unit: 'mmHg', tone: '#C8362A' },
        ]}
      />,
    );
    expect(html).toContain('HR');
    expect(html).toContain('124');
    expect(html).toContain('BP');
    expect(html).toContain('88/52');
    // Tone colours used in inline styles
    expect(html).toMatch(/#E0A82E/i);
    expect(html).toMatch(/#C8362A/i);
  });

  it('DrugChart renders header title + STAT stamp when stat=true', () => {
    const html = renderToStaticMarkup(
      <DrugChart subtitle="ANAPHYLAXIS · ADULT" stat>
        rows
      </DrugChart>,
    );
    expect(html).toContain('PRESCRIPTION CHART');
    expect(html).toContain('ANAPHYLAXIS');
    expect(html).toContain('STAT');
    expect(html).toContain('rows');
  });

  it('ResultsEnvelope renders ward routing + PATIENT RESULTS stamp', () => {
    const html = renderToStaticMarkup(
      <ResultsEnvelope ward="ED · RESUS BAY 2" from="LAB · BLOODS" re="B. Cartwright">
        VBG: pH 7.28, lactate 4.2
      </ResultsEnvelope>,
    );
    expect(html).toContain('ED · RESUS BAY 2');
    expect(html).toContain('LAB · BLOODS');
    expect(html).toContain('B. Cartwright');
    expect(html).toContain('PATIENT');
    expect(html).toContain('RESULTS');
    expect(html).toContain('VBG: pH 7.28');
  });
});
