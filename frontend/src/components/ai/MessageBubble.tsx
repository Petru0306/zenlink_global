import type { Message } from '../../lib/aiStorage';

type Props = {
  message: Message;
};

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={[
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap border',
          isUser
            ? 'bg-white/[0.08] border-white/10 text-white ml-auto'
            : 'bg-white/[0.04] border-white/[0.08] text-[hsl(220,12%,90%)] mr-auto',
        ].join(' ')}
      >
        {message.content}
      </div>
    </div>
  );
}
