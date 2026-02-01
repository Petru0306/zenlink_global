import { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Send } from 'lucide-react';

const STORAGE_KEY = 'zenlink_demo_form_last_v1';
const MAILTO_PLACEHOLDER = 'contact@zenlink.ro';

type FormState = {
  nume: string;
  email: string;
  numeClinica: string;
  nrLocatii: string;
  mesaj: string;
};

const initial: FormState = {
  nume: '',
  email: '',
  numeClinica: '',
  nrLocatii: '',
  mesaj: '',
};

function loadStored(): FormState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return {
      nume: typeof parsed.nume === 'string' ? parsed.nume : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      numeClinica: typeof parsed.numeClinica === 'string' ? parsed.numeClinica : '',
      nrLocatii: typeof parsed.nrLocatii === 'string' ? parsed.nrLocatii : '',
      mesaj: typeof parsed.mesaj === 'string' ? parsed.mesaj : '',
    };
  } catch {
    return initial;
  }
}

export function AboutDemoForm() {
  const [form, setForm] = useState<FormState>(loadStored);
  const [toast, setToast] = useState<string | null>(null);

  const update = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      } catch {
        // ignore
      }
      setForm(initial);
      setToast('Demo request received (mock)');
      setTimeout(() => setToast(null), 4000);
    },
    [form]
  );

  return (
    <section id="demo" className="relative py-20 px-6 bg-[hsl(240,10%,6%)]/40 scroll-mt-24">
      <div className="max-w-[40rem] mx-auto">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-center text-white mb-4">
          Programează un demo ZenLink
        </h2>
        <p className="text-[hsl(220,12%,80%)] text-center mb-10">
          Spune-ne despre clinica ta și revenim cu o prezentare.
        </p>

        {toast && (
          <div className="mb-6 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200 px-4 py-3 text-center text-sm font-medium animate-fade-in">
            {toast}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-6"
        >
          <div>
            <label htmlFor="demo-nume" className="block text-sm font-medium text-[hsl(220,12%,85%)] mb-2">
              Nume
            </label>
            <input
              id="demo-nume"
              type="text"
              value={form.nume}
              onChange={(e) => update('nume', e.target.value)}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              placeholder="Numele tău"
            />
          </div>
          <div>
            <label htmlFor="demo-email" className="block text-sm font-medium text-[hsl(220,12%,85%)] mb-2">
              Email
            </label>
            <input
              id="demo-email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              placeholder="email@exemplu.ro"
            />
          </div>
          <div>
            <label htmlFor="demo-clinica" className="block text-sm font-medium text-[hsl(220,12%,85%)] mb-2">
              Nume clinică
            </label>
            <input
              id="demo-clinica"
              type="text"
              value={form.numeClinica}
              onChange={(e) => update('numeClinica', e.target.value)}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              placeholder="Denumirea clinicii"
            />
          </div>
          <div>
            <label htmlFor="demo-locatii" className="block text-sm font-medium text-[hsl(220,12%,85%)] mb-2">
              Nr. locații
            </label>
            <select
              id="demo-locatii"
              value={form.nrLocatii}
              onChange={(e) => update('nrLocatii', e.target.value)}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', paddingRight: '2.5rem' }}
            >
              <option value="">Selectează</option>
              <option value="1">1</option>
              <option value="2-5">2–5</option>
              <option value="6+">6+</option>
            </select>
          </div>
          <div>
            <label htmlFor="demo-mesaj" className="block text-sm font-medium text-[hsl(220,12%,85%)] mb-2">
              Mesaj (opțional)
            </label>
            <textarea
              id="demo-mesaj"
              value={form.mesaj}
              onChange={(e) => update('mesaj', e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 resize-none"
              placeholder="Detalii suplimentare..."
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 group"
          >
            Trimite cererea de demo
            <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </form>

        <p className="text-center text-[hsl(220,12%,65%)] text-sm mt-6">
          Preferi email direct?{' '}
          <a
            href={`mailto:${MAILTO_PLACEHOLDER}`}
            className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
          >
            {MAILTO_PLACEHOLDER}
          </a>
        </p>
      </div>
    </section>
  );
}
