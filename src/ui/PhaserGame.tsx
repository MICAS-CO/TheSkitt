import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;
    // Dynamically import Phaser + game boot module so the engine stays out
    // of the initial bundle. The first time the player opens the ED hub
    // is when they download it.
    void import('../game/boot')
      .then(async ({ bootGame }) => {
        if (cancelled || !containerRef.current) return;
        gameRef.current = await bootGame(containerRef.current);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError((err as Error).message ?? 'Failed to load Phaser');
      });
    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <div className="phaser-error" role="alert">
        ED hub failed to load: {error}
      </div>
    );
  }
  return <div ref={containerRef} className="phaser-root" data-testid="phaser-root" />;
}
