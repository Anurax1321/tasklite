import { PRIORITIES } from '../constants';
import { Priority } from '../types';

export function PriorityDot({ priority, size = 8 }: { priority: Priority; size?: number }) {
  const meta = PRIORITIES.find(p => p.value === priority);
  return (
    <span
      title={meta?.label}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: meta?.color,
      }}
    />
  );
}
