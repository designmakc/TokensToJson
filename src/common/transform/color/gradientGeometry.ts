export interface GradientGeometry {
  kind: 'linear' | 'radial' | 'conic' | 'diamond';
  start: { x: number; y: number };
  end: { x: number; y: number };
  cssAngle: number;
}

const KIND_MAP = {
  GRADIENT_LINEAR: 'linear',
  GRADIENT_RADIAL: 'radial',
  GRADIENT_ANGULAR: 'conic',
  GRADIENT_DIAMOND: 'diamond',
} as const;

const round = (n: number) => Math.round(n * 1e4) / 1e4;

const buildGeometry = (
  kind: GradientGeometry['kind'],
  start: { x: number; y: number },
  end: { x: number; y: number }
): GradientGeometry => {
  // CSS: 0deg points up, clockwise — hence the +90 offset
  const cssAngle =
    ((Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI +
      90 +
      360) %
    360;

  return {
    kind,
    start: { x: round(start.x), y: round(start.y) },
    end: { x: round(end.x), y: round(end.y) },
    cssAngle: round(cssAngle),
  };
};

const FALLBACK = { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } };

// Plugin API stores gradientTransform (object space -> gradient space);
// the REST API (CLI mode) stores gradientHandlePositions instead. Handles
// live in object space, so for the matrix we invert it and map the gradient
// axis endpoints (0, 0.5) and (1, 0.5) back.
export const getGradientGeometry = (paint: GradientPaint): GradientGeometry => {
  const kind = KIND_MAP[paint.type];
  const t = paint.gradientTransform;

  if (!t) {
    const handles = (paint as any).gradientHandlePositions;
    if (handles?.length >= 2) {
      return buildGeometry(kind, handles[0], handles[1]);
    }
    return buildGeometry(kind, FALLBACK.start, FALLBACK.end);
  }

  const [[a, b, c], [d, e, f]] = t;
  const det = a * e - b * d;

  // degenerate matrix — fall back to identity-like behavior
  if (det === 0) {
    return buildGeometry(kind, FALLBACK.start, FALLBACK.end);
  }

  const inv = [
    [e / det, -b / det, (b * f - e * c) / det],
    [-d / det, a / det, (d * c - a * f) / det],
  ];
  const apply = (p: [number, number]) => ({
    x: inv[0][0] * p[0] + inv[0][1] * p[1] + inv[0][2],
    y: inv[1][0] * p[0] + inv[1][1] * p[1] + inv[1][2],
  });

  return buildGeometry(kind, apply([0, 0.5]), apply([1, 0.5]));
};
