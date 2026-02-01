import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { psychProfileService } from '../services/psychProfileService';

const Q1_OPTIONS = [
  'relaxed',
  'slightly tense',
  'anxious',
  'very anxious',
  'avoid visits',
];

const Q2_OPTIONS = ['no', 'minor', 'significant', 'traumatic'];

const Q3_OPTIONS = [
  'pain',
  'sounds tools',
  'lack of control',
  'anesthesia',
  'time in chair',
  'nothing specific',
];

const Q4_OPTIONS = [
  'tolerate well',
  'tense but cooperate',
  'restless need breaks',
  'panic stop',
];

const Q5_OPTIONS = [
  'stay calm',
  'irritated impatient',
  'worry catastrophize',
  'withdraw avoid',
];

const Q6_OPTIONS = [
  'direct short',
  'calm encouraging',
  'detailed explanations',
  'minimal necessary',
];

const Q7_OPTIONS = [
  'explain each step',
  'only essentials',
  'constant check-ins',
  'fast no talking',
];

const Q8_OPTIONS = [
  'sociable adapt easily',
  'like control want fast',
  'detail oriented worry easily',
  'calm avoid conflicts',
];

const Q9_OPTIONS = [
  'ask immediately',
  'wait for explanation',
  'become uneasy',
  'prefer not ask',
];

const Q10_OPTIONS = ['low importance', 'important', 'very important'];

const Q11_OPTIONS = [
  'panic attacks',
  'needle blood fear',
  'anesthesia adverse reactions',
  'fainting in medical contexts',
  'none',
];

const REQUIRED_KEYS = [
  'q1',
  'q2',
  'q3',
  'q4',
  'q5',
  'q6',
  'q7',
  'q8',
  'q9',
  'q10',
  'q11',
];

type Answers = {
  q1: string;
  q2: string;
  q3: string[];
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string[];
  q9: string;
  q10: string;
  q11: string[];
  q12: string;
};

const INITIAL_ANSWERS: Answers = {
  q1: '',
  q2: '',
  q3: [],
  q4: '',
  q5: '',
  q6: '',
  q7: '',
  q8: [],
  q9: '',
  q10: '',
  q11: [],
  q12: '',
};

export default function PsychProfileOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { psychProfile, psychProfileLoading, refreshPsychProfile, setPsychProfile, user } = useAuth();
  const isEditMode = (location.state as any)?.mode === 'edit';
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [missing, setMissing] = useState<string[]>([]);
  const [q8Error, setQ8Error] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const particles = useMemo(() => {
    const count = 36;
    const pickDepth = () => {
      const r = Math.random();
      if (r < 0.45) return 0;
      if (r < 0.8) return 1;
      return 2;
    };
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 20,
      depth: pickDepth(),
      twinkleDelay: Math.random() * 6,
      twinkleDuration: 3.5 + Math.random() * 4.5,
    }));
  }, []);

  const particlesByDepth = useMemo(() => {
    const far: typeof particles = [];
    const mid: typeof particles = [];
    const near: typeof particles = [];
    for (const p of particles) {
      if (p.depth === 0) far.push(p);
      else if (p.depth === 1) mid.push(p);
      else near.push(p);
    }
    return { far, mid, near };
  }, [particles]);

  useEffect(() => {
    if (!user) return;
    if (!psychProfile && !psychProfileLoading) {
      refreshPsychProfile();
    }
  }, [psychProfile, psychProfileLoading, refreshPsychProfile, user]);

  useEffect(() => {
    if (psychProfile?.completed && !isEditMode) {
      navigate('/dashboard', { replace: true });
    }
  }, [psychProfile, isEditMode, navigate]);

  useEffect(() => {
    if (!psychProfile?.answers) return;
    const next = normalizeAnswers(psychProfile.answers);
    setAnswers((prev) => ({ ...prev, ...next }));
  }, [psychProfile]);

  const completedRequired = useMemo(() => {
    const answeredCount = REQUIRED_KEYS.filter((key) => {
      const value = answers[key as keyof Answers];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return Boolean(value);
    }).length;
    return answeredCount;
  }, [answers]);

  const progressPercent = Math.round((completedRequired / REQUIRED_KEYS.length) * 100);

  const clearMissing = (key: string) => {
    setMissing((prev) => prev.filter((item) => item !== key));
  };

  const handleSingleChange = (key: keyof Answers) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers((prev) => ({ ...prev, [key]: event.target.value }));
    clearMissing(key);
  };

  const handleMultiToggle = (key: 'q3' | 'q8', value: string) => {
    setAnswers((prev) => {
      const current = prev[key];
      const isSelected = current.includes(value);
      if (key === 'q8' && !isSelected && current.length >= 2) {
        setQ8Error('Select up to 2 options.');
        return prev;
      }
      const next = isSelected ? current.filter((item) => item !== value) : [...current, value];
      if (key === 'q8') {
        setQ8Error('');
      }
      clearMissing(key);
      return { ...prev, [key]: next };
    });
  };

  const handleQ11Toggle = (value: string) => {
    setAnswers((prev) => {
      const current = prev.q11;
      const isSelected = current.includes(value);
      if (value === 'none') {
        clearMissing('q11');
        return { ...prev, q11: isSelected ? [] : ['none'] };
      }
      if (current.includes('none')) {
        clearMissing('q11');
        return { ...prev, q11: [value] };
      }
      const next = isSelected ? current.filter((item) => item !== value) : [...current, value];
      clearMissing('q11');
      return { ...prev, q11: next };
    });
  };

  const handleQ12Change = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value.slice(0, 500);
    setAnswers((prev) => ({ ...prev, q12: value }));
  };

  const validate = () => {
    const missingFields: string[] = [];
    if (!answers.q1) missingFields.push('q1');
    if (!answers.q2) missingFields.push('q2');
    if (answers.q3.length === 0) missingFields.push('q3');
    if (!answers.q4) missingFields.push('q4');
    if (!answers.q5) missingFields.push('q5');
    if (!answers.q6) missingFields.push('q6');
    if (!answers.q7) missingFields.push('q7');
    if (answers.q8.length === 0) missingFields.push('q8');
    if (!answers.q9) missingFields.push('q9');
    if (!answers.q10) missingFields.push('q10');
    if (answers.q11.length === 0) missingFields.push('q11');
    setMissing(missingFields);
    setSubmitError(missingFields.length ? 'Please answer all required questions.' : '');
    return missingFields.length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await psychProfileService.upsertProfile({ answers });
      setPsychProfile(response);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[hsl(220,12%,98%)] relative overflow-x-hidden">
      <div className="fixed -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px] pointer-events-none" />
      <div className="fixed -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px] pointer-events-none" />
      <div className="fixed top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px] pointer-events-none" />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particlesByDepth.far.map((p) => (
          <div
            key={`far-${p.id}`}
            className="absolute animate-float-soft"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${16 + p.duration * 0.9}s`,
            }}
          >
            <div
              className="animate-twinkle"
              style={{
                width: '2px',
                height: '2px',
                borderRadius: '9999px',
                backgroundColor: 'rgb(168, 85, 247)',
                boxShadow: '0 0 6px rgba(168, 85, 247, 0.35)',
                '--twinkle-min': 0.22,
                '--twinkle-max': 0.6,
                animationDelay: `${p.twinkleDelay}s`,
                animationDuration: `${p.twinkleDuration + 1.5}s`,
              } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particlesByDepth.mid.map((p) => (
          <div
            key={`mid-${p.id}`}
            className="absolute animate-float-soft"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${14 + p.duration * 0.75}s`,
            }}
          >
            <div
              className="animate-twinkle"
              style={{
                width: '2.5px',
                height: '2.5px',
                borderRadius: '9999px',
                backgroundColor: 'rgb(168, 85, 247)',
                boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)',
                '--twinkle-min': 0.28,
                '--twinkle-max': 0.78,
                animationDelay: `${p.twinkleDelay}s`,
                animationDuration: `${p.twinkleDuration}s`,
              } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particlesByDepth.near.map((p) => (
          <div
            key={`near-${p.id}`}
            className="absolute animate-float-soft"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${12 + p.duration * 0.6}s`,
            }}
          >
            <div
              className="animate-twinkle"
              style={{
                width: '3px',
                height: '3px',
                borderRadius: '9999px',
                backgroundColor: 'rgb(168, 85, 247)',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                '--twinkle-min': 0.35,
                '--twinkle-max': 0.95,
                animationDelay: `${p.twinkleDelay}s`,
                animationDuration: `${Math.max(2.8, p.twinkleDuration - 0.8)}s`,
              } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-purple-200/70">Dental Psychological Profile Survey</p>
            <h1 className="text-3xl font-semibold text-white">Help us personalize your care</h1>
            <p className="mt-2 text-sm text-purple-200/70">
              Takes about 5–7 minutes. Your answers help the dental team create a calmer, safer visit.
            </p>
          </div>
          <div className="text-xs text-purple-200/70">
            {isEditMode ? 'Editing existing profile' : 'New profile'}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <div className="flex items-center justify-between text-xs text-purple-100">
            <span>{completedRequired} / {REQUIRED_KEYS.length} required answered</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-purple-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {submitError && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {submitError}
            </div>
          )}

          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
            <h2 className="text-lg font-semibold">Section 1 — Experience</h2>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q1: How do you usually feel before dental visits? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q1_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="q1"
                      value={option}
                      checked={answers.q1 === option}
                      onChange={handleSingleChange('q1')}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {missing.includes('q1') && <p className="text-xs text-red-300">Required.</p>}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q2: Have you had a past negative dental experience? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q2_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="q2"
                      value={option}
                      checked={answers.q2 === option}
                      onChange={handleSingleChange('q2')}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {missing.includes('q2') && <p className="text-xs text-red-300">Required.</p>}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q3: What tends to trigger discomfort or anxiety? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q3_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      value={option}
                      checked={answers.q3.includes(option)}
                      onChange={() => handleMultiToggle('q3', option)}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {missing.includes('q3') && <p className="text-xs text-red-300">Select at least one.</p>}
            </fieldset>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
            <h2 className="text-lg font-semibold">Section 2 — Pain & Stress</h2>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q4: During treatment, how do you usually respond? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q4_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="q4"
                      value={option}
                      checked={answers.q4 === option}
                      onChange={handleSingleChange('q4')}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {missing.includes('q4') && <p className="text-xs text-red-300">Required.</p>}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q5: How do you cope with stress in dental settings? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q5_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="q5"
                      value={option}
                      checked={answers.q5 === option}
                      onChange={handleSingleChange('q5')}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {missing.includes('q5') && <p className="text-xs text-red-300">Required.</p>}
            </fieldset>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
            <h2 className="text-lg font-semibold">Section 3 — Communication</h2>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q6: Preferred tone from the dentist? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q6_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="q6"
                      value={option}
                      checked={answers.q6 === option}
                      onChange={handleSingleChange('q6')}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {missing.includes('q6') && <p className="text-xs text-red-300">Required.</p>}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q7: How much explanation do you want during treatment? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q7_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="q7"
                      value={option}
                      checked={answers.q7 === option}
                      onChange={handleSingleChange('q7')}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {missing.includes('q7') && <p className="text-xs text-red-300">Required.</p>}
            </fieldset>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
            <h2 className="text-lg font-semibold">Section 4 — Temperament (MAX 2 choices)</h2>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q8: Which descriptions fit you best? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q8_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      value={option}
                      checked={answers.q8.includes(option)}
                      onChange={() => handleMultiToggle('q8', option)}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {q8Error && <p className="text-xs text-red-300">{q8Error}</p>}
              {missing.includes('q8') && <p className="text-xs text-red-300">Select at least one.</p>}
            </fieldset>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
            <h2 className="text-lg font-semibold">Section 5 — Control & Cooperation</h2>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q9: If you feel unsure, what do you usually do? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q9_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="q9"
                      value={option}
                      checked={answers.q9 === option}
                      onChange={handleSingleChange('q9')}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {missing.includes('q9') && <p className="text-xs text-red-300">Required.</p>}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q10: How important is a feeling of control to you? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q10_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="q10"
                      value={option}
                      checked={answers.q10 === option}
                      onChange={handleSingleChange('q10')}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {missing.includes('q10') && <p className="text-xs text-red-300">Required.</p>}
            </fieldset>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
            <h2 className="text-lg font-semibold">Section 6 — Flags</h2>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-purple-100">
                Q11: Do any of these apply to you? <span className="text-red-300">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Q11_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      value={option}
                      checked={answers.q11.includes(option)}
                      onChange={() => handleQ11Toggle(option)}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-purple-200/70">
                If you select “none”, it must be the only option.
              </p>
              {missing.includes('q11') && <p className="text-xs text-red-300">Select at least one.</p>}
            </fieldset>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
            <h2 className="text-lg font-semibold">Section 7 — Open text</h2>

            <div className="space-y-2">
              <label htmlFor="q12" className="text-sm font-medium text-purple-100">
                Q12 (optional): Anything the dentist should know to make you more comfortable?
              </label>
              <textarea
                id="q12"
                value={answers.q12}
                onChange={handleQ12Change}
                maxLength={500}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-purple-200/50 focus:border-purple-400 focus:outline-none"
                placeholder="Share anything that would help us support you better."
              />
              <div className="text-xs text-purple-200/70">{answers.q12.length}/500</div>
            </div>
          </section>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-purple-200/70">Fields marked * are required.</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-purple-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : 'Submit survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function normalizeAnswers(input: Record<string, any>): Partial<Answers> {
  return {
    q1: typeof input.q1 === 'string' ? input.q1 : '',
    q2: typeof input.q2 === 'string' ? input.q2 : '',
    q3: Array.isArray(input.q3) ? input.q3 : [],
    q4: typeof input.q4 === 'string' ? input.q4 : '',
    q5: typeof input.q5 === 'string' ? input.q5 : '',
    q6: typeof input.q6 === 'string' ? input.q6 : '',
    q7: typeof input.q7 === 'string' ? input.q7 : '',
    q8: Array.isArray(input.q8) ? input.q8 : [],
    q9: typeof input.q9 === 'string' ? input.q9 : '',
    q10: typeof input.q10 === 'string' ? input.q10 : '',
    q11: Array.isArray(input.q11) ? input.q11 : [],
    q12: typeof input.q12 === 'string' ? input.q12 : '',
  };
}

