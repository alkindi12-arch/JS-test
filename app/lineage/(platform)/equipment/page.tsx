import { Stack, Surface } from '@/components/design-system';
import { EquipmentListItem } from '@/components/domain/EquipmentListItem';
import { PageHeader } from '@/components/layout/PageHeader';
import { listEquipment } from '@/lib/data/plant';

export default async function EquipmentCataloguePage() {
  const equipment = await listEquipment();

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Catalogue"
        title="Equipment"
        description="Searchable tag list. Responsive list layout scales from phone to wide desktop."
        breadcrumbs={[{ label: 'Dashboard', href: '/lineage/dashboard' }, { label: 'Equipment' }]}
      />
      <Surface pad={0} className="animate-fade-up">
        {equipment.map((item) => (
          <EquipmentListItem key={item.id} item={item} />
        ))}
      </Surface>
    </Stack>
  );
}
