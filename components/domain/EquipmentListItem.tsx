import { Badge, Stack, Text } from '@/components/design-system';
import { labelEquipmentStatus } from '@/lib/format';
import type { Equipment, EquipmentStatus } from '@/lib/types/domain';
import Link from 'next/link';
import styles from './EquipmentListItem.module.css';

function statusTone(status: EquipmentStatus) {
  switch (status) {
    case 'running':
      return 'ok' as const;
    case 'standby':
      return 'signal' as const;
    case 'offline':
      return 'neutral' as const;
    case 'maintenance':
      return 'danger' as const;
  }
}

export function EquipmentListItem({ item }: { item: Equipment }) {
  return (
    <Link href={`/lineage/equipment/${item.id}`} className={styles.item}>
      <Stack gap={2}>
        <Stack direction="horizontal" gap={2} wrap align="center">
          <Text mono weight="bold" size="md">
            {item.tagNumber}
          </Text>
          <Badge tone={item.criticality === 'high' ? 'danger' : 'neutral'}>
            {item.criticality}
          </Badge>
        </Stack>
        <Text size="sm" tone="mute">
          {item.description}
        </Text>
      </Stack>
      <Badge tone={statusTone(item.status)} dot>
        {labelEquipmentStatus(item.status)}
      </Badge>
    </Link>
  );
}
