import { redirect } from 'next/navigation';

/** Convenience entry: /lineage → Lineage dashboard */
export default function LineageIndexPage() {
  redirect('/lineage/dashboard');
}
