import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AiTurn } from '../../lib/aiTurn';

type Props = {
  turn: AiTurn;
  onOptionSelect?: (value: string, label: string) => void;
  onFreeTextSubmit?: (text: string) => void;
};

export function StructuredMessage({ turn, onOptionSelect, onFreeTextSubmit }: Props) {
  const [showFreeText, setShowFreeText] = useState(false);
  const [freeText, setFreeText] = useState('');

  if (turn.mode === 'conclusion' && turn.conclusion) {
    return <ConclusionCard conclusion={turn.conclusion} />;
  }

  if (turn.mode === 'urgent' && turn.conclusion) {
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-red-500/10 border-2 border-red-500/30 rounded-2xl">
          <div className="text-red-400 font-semibold text-lg mb-2">⚠️ Urgent</div>
          <div className="text-white/90">{turn.title}</div>
        </div>
        <ConclusionCard conclusion={turn.conclusion} />
      </div>
    );
  }

  // Question mode
  return (
    <div className="space-y-4">
      {/* Progress pill */}
      {turn.progress && (
        <div className="text-xs text-white/60 font-medium">
          Pasul {turn.progress.step}/{turn.progress.total}
        </div>
      )}

      {/* Severity meter */}
      {turn.severity && (
        <SeverityMeter severity={turn.severity} />
      )}

      {/* Title */}
      <div className="text-xl font-bold text-white">{turn.title}</div>

      {/* Question */}
      {turn.question && (
        <div className="text-lg text-white/95 leading-relaxed font-medium">{turn.question}</div>
      )}

      {/* Rationale */}
      {turn.rationale && (
        <div className="text-sm text-white/60 italic mt-2">{turn.rationale}</div>
      )}

      {/* Highlights */}
      {turn.highlight && turn.highlight.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {turn.highlight.map((h, i) => (
            <span
              key={i}
              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                h.color === 'purple'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : h.color === 'amber'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : h.color === 'red'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}
            >
              {h.label}
            </span>
          ))}
        </div>
      )}

      {/* Options */}
      {turn.options && turn.options.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-6">
          {turn.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onOptionSelect?.(opt.value, opt.label)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                opt.kind === 'primary'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-500/50'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Free text input */}
      {turn.allowFreeText && (
        <div className="mt-3">
          {!showFreeText ? (
            <button
              onClick={() => setShowFreeText(true)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/20 text-sm font-medium transition-colors"
            >
              Altceva…
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && freeText.trim()) {
                    onFreeTextSubmit?.(freeText.trim());
                    setFreeText('');
                    setShowFreeText(false);
                  }
                }}
                placeholder={turn.freeTextPlaceholder || 'Scrie aici...'}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                autoFocus
              />
              <button
                onClick={() => {
                  if (freeText.trim()) {
                    onFreeTextSubmit?.(freeText.trim());
                    setFreeText('');
                    setShowFreeText(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
              >
                Trimite
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SeverityMeter({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { label: 'Ușoară', color: 'bg-green-500', text: 'text-green-300' },
    medium: { label: 'Moderată', color: 'bg-amber-500', text: 'text-amber-300' },
    high: { label: 'Severă', color: 'bg-red-500', text: 'text-red-300' },
  };

  const { label, color, text } = config[severity];
  const width = severity === 'low' ? '33%' : severity === 'medium' ? '66%' : '100%';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={text}>{label}</span>
        <span className="text-white/60">Severitate</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

function ConclusionCard({ conclusion }: { conclusion: AiTurn['conclusion'] }) {
  const navigate = useNavigate();

  if (!conclusion) return null;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl w-full">
      {/* Title */}
      <div className="text-xl font-bold text-white">✅ Rezumat & ce aș face acum</div>

      {/* Summary */}
      <div className="text-base text-white/90 leading-relaxed">{conclusion.summary}</div>

      {/* Probabilities */}
      {conclusion.probabilities && conclusion.probabilities.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-white/80 uppercase tracking-wide">
            Cel mai probabil
          </div>
          {conclusion.probabilities.map((prob, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/90 font-medium">{prob.label}</span>
                <span className="text-purple-300 font-semibold">{prob.percent}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                  style={{ width: `${prob.percent}%` }}
                />
              </div>
              {prob.note && (
                <div className="text-xs text-white/60">{prob.note}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Next Steps */}
      {conclusion.nextSteps && conclusion.nextSteps.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-white/80 uppercase tracking-wide">
            Ce poți face acum
          </div>
          <div className="grid gap-3">
            {conclusion.nextSteps.map((step, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
              >
                <span className="text-2xl">{step.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white mb-1">{step.title}</div>
                  <div className="text-sm text-white/70">{step.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {conclusion.redFlags && conclusion.redFlags.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-red-300 uppercase tracking-wide">
            Când e urgent
          </div>
          <ul className="space-y-1.5">
            {conclusion.redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                <span className="text-red-400 mt-0.5">⚠️</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => navigate(conclusion.cta.href || '/doctori')}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
      >
        <span>📅</span>
        <span>{conclusion.cta.label}</span>
      </button>
    </div>
  );
}
