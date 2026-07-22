'use client';

import { Button } from '@/shared/ui/button';
import { Modal } from '@/shared/ui/modal';

type Preset = 'temperature' | 'system' | 'model' | 'duplicate' | 'custom';
const options: Array<{ id: Preset; title: string; description: string }> = [
  { id: 'temperature', title: 'Change temperature', description: 'Copy the parent world and alter sampling temperature plus seed.' },
  { id: 'system', title: 'Change system instruction', description: 'Keep the user prompt but make the system instruction skeptical.' },
  { id: 'model', title: 'Change model', description: 'Use the compact mock model when available; external providers keep their configured model.' },
  { id: 'duplicate', title: 'Duplicate exactly', description: 'Copy visible prompt and configuration without pretending to continue hidden state.' },
  { id: 'custom', title: 'Custom', description: 'Create a branch and fine-tune parameters in the inspector.' }
];

export function CreateRealityModal({ onClose, onCreate }: { onClose: () => void; onCreate: (preset: Preset) => void }) {
  return (
    <Modal title="Create another reality" onClose={onClose}>
      <div className="grid gap-3">
        {options.map((option) => (
          <button key={option.id} className="border border-hairline p-4 text-left hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal" onClick={() => onCreate(option.id)}>
            <span className="block text-base font-medium">{option.title}</span>
            <span className="mt-1 block text-sm text-secondary">{option.description}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-end"><Button variant="ghost" onClick={onClose}>Cancel</Button></div>
    </Modal>
  );
}
