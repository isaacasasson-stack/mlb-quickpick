import { useState } from 'react';

interface Props {
  shareText: string;
}

type State = 'idle' | 'copying' | 'copied' | 'error';

export default function ShareButton({ shareText }: Props) {
  const [state, setState] = useState<State>('idle');

  const handleShare = async () => {
    if (state === 'copying') return;
    setState('copying');
    try {
      // Always copy to clipboard first so the text is ready to paste
      await navigator.clipboard.writeText(shareText);
      setState('copied');
      setTimeout(() => setState('idle'), 2500);
      // Also open native share sheet on mobile if available
      if (navigator.share) {
        navigator.share({ title: 'MLB QuickPick', text: shareText }).catch(() => {});
      }
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2500);
    }
  };

  const label =
    state === 'copying' ? 'Copying...' :
    state === 'copied'  ? '✓ Copied to clipboard!' :
    state === 'error'   ? 'Error — try again' :
    '📋 Copy & Share Results';

  return (
    <button
      onClick={handleShare}
      className={`w-full py-3 rounded-xl font-bold text-base transition-all duration-150 active:scale-95 ${
        state === 'copied'
          ? 'bg-green-600 text-white'
          : state === 'error'
          ? 'bg-red-600 text-white'
          : 'bg-white text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}
