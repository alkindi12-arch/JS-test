import { Stack, Surface, Text } from '@/components/design-system';
import { PageHeader } from '@/components/layout/PageHeader';

export default function ReportsPage() {
  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Phase 2"
        title="Reports"
        description="PDF generation hooks will land here — activity pack with timeline, files, duration, and approval."
        breadcrumbs={[{ label: 'Dashboard', href: '/lineage/dashboard' }, { label: 'Reports' }]}
      />
      <Surface pad={6} className="animate-fade-up">
        <Stack gap={3}>
          <Text display size="xl">
            Designed for expansion
          </Text>
          <Text tone="mute">
            Report templates will consume the same domain types and design tokens as the live
            screens, so print/PDF stays visually aligned with the product.
          </Text>
        </Stack>
      </Surface>
    </Stack>
  );
}
