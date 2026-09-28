import { Button, Stack, Surface } from '@/components/design-system';
import { EquipmentListItem } from '@/components/domain/EquipmentListItem';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { listEquipment } from '@/lib/data/plant';

export default async function EquipmentCataloguePage() {
  const [equipment, caps] = await Promise.all([
    listEquipment(),
    getSessionCapabilities(),
  ]);

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Catalogue"
        title="Equipment"
        description="Searchable tag list. Responsive list layout scales from phone to wide desktop."
        breadcrumbs={[{ label: 'Dashboard', href: '/lineage/dashboard' }, { label: 'Equipment' }]}
        actions={
          caps.canAdmin ? (
            <Button href="/lineage/equipment/new">Add equipment</Button>
          ) : undefined
        }
      />
      <Surface pad={0} className="animate-fade-up">
        {equipment.map((item) => (
          <EquipmentListItem key={item.id} item={item} />
        ))}
      </Surface>
    </Stack>
  );
}
