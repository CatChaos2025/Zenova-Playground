import React from 'react';
import { clsx } from 'clsx';
import { useWindowResize } from '../../hooks/useWindowResize';
import './Window.css';

interface ResizeHandlesProps {
  windowId: string;
}

const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;
type Direction = typeof directions[number];

export function ResizeHandles({ windowId }: ResizeHandlesProps) {
  return (
    <>
      {directions.map(dir => {
        const resizeProps = useWindowResize({
          windowId,
          direction: dir,
          enabled: true,
        });

        return (
          <div
            key={dir}
            className={clsx('window__resize-handle', `window__resize-handle--${dir}`)}
            {...resizeProps}
          />
        );
      })}
    </>
  );
}