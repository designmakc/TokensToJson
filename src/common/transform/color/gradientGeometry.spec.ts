import { describe, expect, test } from 'vitest';
import { getGradientGeometry } from './gradientGeometry';

type Vec = { x: number; y: number };

// Build the forward matrix (object -> gradient space) whose inverse maps
// (0, 0.5) -> start and (1, 0.5) -> end. Mirrors how Figma stores it.
const matrixFromHandles = (start: Vec, end: Vec, flip = false): Transform => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  // gradient -> object space affine
  const m = flip
    ? [
        [dx, dy, start.x - dy / 2],
        [dy, -dx, start.y + dx / 2],
      ]
    : [
        [dx, -dy, start.x + dy / 2],
        [dy, dx, start.y - dx / 2],
      ];
  const [[a, b, c], [d, e, f]] = m;
  const det = a * e - b * d;
  return [
    [e / det, -b / det, (b * f - e * c) / det],
    [-d / det, a / det, (d * c - a * f) / det],
  ] as Transform;
};

const linear = (transform: Transform): GradientPaint =>
  ({
    type: 'GRADIENT_LINEAR',
    gradientTransform: transform,
    gradientStops: [],
  } as unknown as GradientPaint);

const cases: {
  name: string;
  start: Vec;
  end: Vec;
  cssAngle: number;
}[] = [
  { name: '0deg (bottom to top)', start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 }, cssAngle: 0 },
  { name: '45deg', start: { x: 0, y: 1 }, end: { x: 1, y: 0 }, cssAngle: 45 },
  { name: '90deg (left to right)', start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 }, cssAngle: 90 },
  { name: '135deg', start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, cssAngle: 135 },
  { name: '180deg (top to bottom)', start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 }, cssAngle: 180 },
  { name: '270deg (right to left)', start: { x: 1, y: 0.5 }, end: { x: 0, y: 0.5 }, cssAngle: 270 },
];

describe('getGradientGeometry', () => {
  for (const c of cases) {
    test(c.name, () => {
      const geometry = getGradientGeometry(
        linear(matrixFromHandles(c.start, c.end))
      );
      expect(geometry.kind).toBe('linear');
      expect(geometry.start.x).toBeCloseTo(c.start.x, 3);
      expect(geometry.start.y).toBeCloseTo(c.start.y, 3);
      expect(geometry.end.x).toBeCloseTo(c.end.x, 3);
      expect(geometry.end.y).toBeCloseTo(c.end.y, 3);
      expect(geometry.cssAngle).toBeCloseTo(c.cssAngle, 1);
    });
  }

  test('flipped (mirrored) matrix keeps handles and angle', () => {
    const start = { x: 0, y: 0 };
    const end = { x: 1, y: 1 };
    const geometry = getGradientGeometry(
      linear(matrixFromHandles(start, end, true))
    );
    expect(geometry.start.x).toBeCloseTo(0, 3);
    expect(geometry.start.y).toBeCloseTo(0, 3);
    expect(geometry.end.x).toBeCloseTo(1, 3);
    expect(geometry.end.y).toBeCloseTo(1, 3);
    expect(geometry.cssAngle).toBeCloseTo(135, 1);
  });

  test('bottom-to-top never emits 360 (canonical 0)', () => {
    // real-world Figma matrix for a bottom-to-top gradient; float error
    // puts the raw angle at 359.9999…
    const geometry = getGradientGeometry(
      linear(matrixFromHandles({ x: 0.5, y: 1.0000001 }, { x: 0.5, y: 0 }))
    );
    expect(geometry.cssAngle).toBeGreaterThanOrEqual(0);
    expect(geometry.cssAngle).toBeLessThan(360);
  });

  test('degenerate matrix falls back to horizontal', () => {
    const geometry = getGradientGeometry(
      linear([
        [0, 0, 0],
        [0, 0, 0],
      ] as Transform)
    );
    expect(geometry).toEqual({
      kind: 'linear',
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
      cssAngle: 90,
    });
  });

  test('identity matrix is 90deg left-to-right', () => {
    const geometry = getGradientGeometry(
      linear([
        [1, 0, 0],
        [0, 1, 0],
      ] as Transform)
    );
    expect(geometry.start).toEqual({ x: 0, y: 0.5 });
    expect(geometry.end).toEqual({ x: 1, y: 0.5 });
    expect(geometry.cssAngle).toBe(90);
  });

  test('REST API shape: gradientHandlePositions, no gradientTransform', () => {
    const geometry = getGradientGeometry({
      type: 'GRADIENT_LINEAR',
      gradientHandlePositions: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      gradientStops: [],
    } as unknown as GradientPaint);
    expect(geometry.start).toEqual({ x: 0, y: 0 });
    expect(geometry.end).toEqual({ x: 1, y: 1 });
    expect(geometry.cssAngle).toBe(135);
  });

  test('neither transform nor handles falls back to horizontal', () => {
    const geometry = getGradientGeometry({
      type: 'GRADIENT_LINEAR',
      gradientStops: [],
    } as unknown as GradientPaint);
    expect(geometry).toEqual({
      kind: 'linear',
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
      cssAngle: 90,
    });
  });

  test('maps paint types to kinds', () => {
    const identity: Transform = [
      [1, 0, 0],
      [0, 1, 0],
    ];
    const kindOf = (type: string) =>
      getGradientGeometry({
        type,
        gradientTransform: identity,
        gradientStops: [],
      } as unknown as GradientPaint).kind;

    expect(kindOf('GRADIENT_RADIAL')).toBe('radial');
    expect(kindOf('GRADIENT_ANGULAR')).toBe('conic');
    expect(kindOf('GRADIENT_DIAMOND')).toBe('diamond');
  });
});
