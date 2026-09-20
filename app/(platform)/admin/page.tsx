import { Stack, Surface, Text } from '@/components/design-system';
import { PageHeader } from '@/components/layout/PageHeader';

export default function AdminPage() {
  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Administration"
        title="Admin"
        description="Master data for areas, units, equipment, and users — scaffold ready for Phase 0."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin' }]}
      />
      <Surface pad={6} className="animate-fade-up">
        <Stack gap={3}>
          <Text display size="xl">
            Master data console
          </Text>
          <Text tone="mute">
            Structure is isolated under the platform route group so admin features can grow
            without coupling to operational screens.
          </Text>
        </Stack>
      </Surface>
    </Stack>
  );
}
