import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const MAX_MESSAGES = 4; // After this, redirect to full AI page

// Preview question with answer options
const PREVIEW_QUESTION = {
  question: "Cât de des experimentezi sensibilitate dentară?",
  options: [
    { id: 'a', text: "Rar, doar ocazional", value: "rare" },
    { id: 'b', text: "De câteva ori pe săptămână", value: "weekly" },
    { id: 'c', text: "Zilnic sau aproape zilnic", value: "daily" },
    { id: 'd', text: "Nu am simțit niciodată", value: "never" },
  ]
};

type Props = {
  onContinueToFull?: () => void;
};

export function AIPreviewWidget({ onContinueToFull }: Props) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleOptionSelect = useCallback((optionId: string) => {
    if (selectedOption) return; // Prevent multiple selections
    setSelectedOption(optionId);
    setTimeout(() => {
      setShowFeedback(true);
    }, 300);
  }, [selectedOption]);

  const handleContinueToFull = useCallback(() => {
    if (!selectedOption) return;
    
    const selectedOptionData = PREVIEW_QUESTION.options.find(opt => opt.id === selectedOption);
    if (!selectedOptionData) return;

    // Format message with question and answer
    const initialMessage = `${PREVIEW_QUESTION.question}\n\nRăspuns: ${selectedOptionData.text}`;
    
    if (onContinueToFull) {
      // If custom handler, pass the message
      navigate('/ai', { 
        state: { 
          initialMessage,
          previewQuestion: PREVIEW_QUESTION.question,
          previewAnswer: selectedOptionData.text
        } 
      });
      onContinueToFull();
    } else {
      navigate('/ai', { 
        state: { 
          initialMessage,
          previewQuestion: PREVIEW_QUESTION.question,
          previewAnswer: selectedOptionData.text
        } 
      });
    }
  }, [navigate, onContinueToFull, selectedOption]);

  return (
    <div className="relative w-full h-full flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-600/10 to-purple-500/10 backdrop-blur-sm shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300">
      {/* Subtle gradient border glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />

      {/* Question container */}
      <div className="relative flex-1 flex flex-col min-h-0 bg-[hsl(240,10%,6%)]/40 p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
            <span className="text-xs font-medium text-purple-300">Interviu medical interactiv</span>
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
            {PREVIEW_QUESTION.question}
          </h3>
          <p className="text-sm text-white/50">
            Selectează răspunsul care te descrie cel mai bine
          </p>
        </div>

        {/* Options */}
        <div className="flex-1 flex flex-col justify-center space-y-3 mb-6">
          {PREVIEW_QUESTION.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const isDisabled = selectedOption !== null && !isSelected;
            
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={isDisabled}
                className={`
                  relative w-full text-left px-5 py-4 rounded-xl border transition-all duration-300
                  ${isSelected 
                    ? 'bg-gradient-to-r from-purple-600/30 to-purple-500/30 border-purple-500/50 shadow-lg shadow-purple-500/20 scale-[1.02]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30 hover:scale-[1.01]'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                      ${isSelected 
                        ? 'border-purple-400 bg-purple-500/20' 
                        : 'border-white/30 bg-white/5'
                      }
                    `}>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <span className={`text-sm md:text-base ${isSelected ? 'text-white font-medium' : 'text-white/80'}`}>
                      {option.text}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback and CTA */}
        {showFeedback && (
          <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/30 animate-fade-in">
            <p className="text-white/90 text-sm mb-4 text-center">
              ✓ Răspuns înregistrat! Pentru o analiză completă și recomandări personalizate, continuă interviul în interfața completă.
            </p>
            <button
              onClick={handleContinueToFull}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-medium transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
            >
              <span>Continuă interviul complet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Safety/compliance line */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-[10px] text-white/40 text-center">
            ZenLink AI oferă ghidare informativă și nu înlocuiește sfatul medical profesional.
          </p>
        </div>
      </div>
    </div>
  );
}
