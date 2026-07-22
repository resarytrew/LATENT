export type TimelineEventType =
  | 'world.created'
  | 'world.branched'
  | 'generation.started'
  | 'generation.chunk'
  | 'generation.completed'
  | 'generation.failed'
  | 'parameter.changed'
  | 'divergence.detected'
  | 'playback.paused'
  | 'branch.created';

export interface TimelineEvent<TPayload = Record<string, unknown>> {
  id: string;
  worldId: string;
  type: TimelineEventType;
  timestamp: string;
  payload: TPayload;
  sequence: number;
}
