import { Workspace } from '@/features/experiment/components/Workspace';

export default function ExperimentPage({ params }: { params: { experimentId: string } }) {
  return <Workspace experimentId={params.experimentId} />;
}
