interface StarDisplayProps {
  rating: number;
  size?: number;
}

/**
 * Renders a row of 5 stars (full / half / empty) based on `rating`.
 * Supports half-star via SVG clip-path.
 */
export default function StarDisplay({ rating, size = 20 }: StarDisplayProps) {
  return (
    <div style={{ display: 'inline-flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((s) => {
        const full = rating >= s;
        const half = !full && rating >= s - 0.5;
        const clipId = `half-${size}-${s}`;

        return (
          <svg key={s} width={size} height={size} viewBox="0 0 24 24"
            fill="none" stroke="#C4BDB8" strokeWidth="1.8">
            {half && (
              <defs>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width="12" height="24" />
                </clipPath>
              </defs>
            )}
            {/* empty star base */}
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            {/* filled overlay */}
            {(full || half) && (
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill="#E8A020"
                stroke="#E8A020"
                clipPath={half ? `url(#${clipId})` : undefined}
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}