import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { EDSceneData } from '../game/scenes/EDScene';

interface Props {
  sceneData?: EDSceneData;
}

export function PhaserGame({ sceneData }: Props = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The latest scene data lives in a ref so we can call .scene.start with
  // it after Phaser boots without recreating the engine.
  const dataRef = useRef<EDSceneData | undefined>(sceneData);
  dataRef.current = sceneData;

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;
    void import('../game/boot')
      .then(async ({ bootGame }) => {
        if (cancelled || !containerRef.current) return;
        gameRef.current = await bootGame({
          parent: containerRef.current,
          sceneData: dataRef.current,
        });
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

  // When the scene data changes (e.g. clock advanced or case state changed),
  // restart the ED scene so it re-renders.
  useEffect(() => {
    if (!sceneData) return;
    const game = gameRef.current;
    if (!game) return;
    game.scene.start('ed', sceneData);
  }, [sceneData]);

  if (error) {
    return (
      <div className="phaser-error" role="alert">
        ED hub failed to load: {error}
      </div>
    );
  }
  return <div ref={containerRef} className="phaser-root" data-testid="phaser-root" />;
}
