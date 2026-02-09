const toneStyles = {
  discovery: "border-blue-500/30 bg-blue-500/10 text-blue-100",
  booking: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  consultation: "border-purple-500/30 bg-purple-500/10 text-purple-100",
  ai: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  benefit: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
  ui: "border-white/10 bg-white/5 text-white/80",
};

function FlowNode({ title, description, meta, tone = "ui" }) {
  return (
    <div
      className={`min-w-[180px] max-w-[280px] rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-2xl ${toneStyles[tone]}`}
    >
      <div className="text-sm font-semibold text-white">{title}</div>
      {description && <div className="mt-1 text-xs text-white/70 leading-relaxed">{description}</div>}
      {meta && <div className="mt-2 text-[10px] uppercase tracking-wider text-white/40">{meta}</div>}
    </div>
  );
}

function FlowConnector({ vertical = false, label }) {
  return (
    <div className={`flex items-center ${vertical ? "flex-col" : "flex-row"} gap-2`}>
      <div
        className={`rounded-full bg-white/20 ${vertical ? "h-8 w-[2px]" : "h-[2px] w-10"}`}
      />
      {label && (
        <span className={`text-[10px] text-white/50 ${vertical ? "writing-vertical" : ""}`}>
          {label}
        </span>
      )}
    </div>
  );
}

function FlowRow({ nodes, vertical = false }) {
  return (
    <div className={`flex ${vertical ? "flex-col" : "flex-wrap"} items-center gap-3`}>
      {nodes.map((node, index) => (
        <div key={`${node.title}-${index}`} className={`flex ${vertical ? "flex-col" : "flex-row"} items-center gap-3`}>
          <FlowNode {...node} />
          {index < nodes.length - 1 && <FlowConnector vertical={vertical} />}
        </div>
      ))}
    </div>
  );
}

function FlowSection({ title, description, children, highlight = false }) {
  return (
    <section className={`space-y-6 ${highlight ? "bg-white/5 rounded-3xl p-6 border border-white/10" : ""}`}>
      <div>
        <h2 className={`text-2xl font-bold ${highlight ? "text-cyan-300" : "text-white"}`}>{title}</h2>
        {description && <p className="text-sm text-white/60 mt-2 leading-relaxed">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function BenefitCard({ title, items, tone = "benefit" }) {
  return (
    <div className={`rounded-xl border p-4 backdrop-blur-xl ${toneStyles[tone]}`}>
      <div className="text-sm font-semibold text-white mb-2">{title}</div>
      <ul className="space-y-1 text-xs text-white/70">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PageCard({ pageName, role, userActions, value, tone = "discovery", icon }) {
  return (
    <div className={`rounded-2xl border p-6 backdrop-blur-xl shadow-2xl ${toneStyles[tone]} h-full`}>
      <div className="flex items-center gap-3 mb-4">
        {icon && <span className="text-2xl">{icon}</span>}
        <h3 className="text-lg font-bold text-white">{pageName}</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50 mb-1">Rolul paginii</div>
          <div className="text-sm text-white/90 leading-relaxed">{role}</div>
        </div>
        
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50 mb-1">Ce poate face utilizatorul</div>
          <ul className="space-y-1.5 text-sm text-white/80">
            {userActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="pt-2 border-t border-white/10">
          <div className="text-xs uppercase tracking-wider text-white/50 mb-1">Valoare</div>
          <div className="text-sm text-cyan-300 font-medium leading-relaxed">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function Flowchart() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px]" />
        <div className="absolute -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-400/25 via-cyan-500/15 to-transparent blur-[80px]" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-amber-400/20 to-transparent blur-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12 relative z-10">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white">ZenLink — Flow-ul Platformei</h1>
          <p className="text-xl text-white/70">
            Explicat pentru Clienți și Investitori
          </p>
          <p className="text-sm text-white/50 max-w-2xl mx-auto">
            ZenLink nu este doar o platformă de programări. Este un ecosistem complet care transformă experiența medicală pentru pacienți, medici și clinici.
          </p>
        </header>

        {/* Flow-ul General - Structurat pe Pagini */}
        <FlowSection
          title="🎯 Flow-ul General al Platformei"
          description="De la prima impresie până la follow-up — o experiență completă și ghidată"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pagina Acasă */}
            <PageCard
              pageName="Pagina Acasă"
              icon="🏠"
              role="Prima impresie: ZenLink se prezintă ca hub modern pentru sănătate"
              userActions={[
                "Vezi prezentarea platformei",
                "Navighează la Medici/Clinici",
                "Descoperă AI Assistant (discută despre probleme medicale)",
                "Accesează autentificare"
              ]}
              value="Mai puțin timp pierdut, mai multă claritate"
              tone="discovery"
            />

            {/* AI Assistant */}
            <PageCard
              pageName="AI Assistant"
              icon="🤖"
              role="Asistent inteligent — poate fi descoperit din curiozitate sau intenționat"
              userActions={[
                "Discută despre o problemă medicală",
                "Primește informații și context",
                "La final, AI-ul recomandă un doctor/clinică potrivită"
              ]}
              value="Claritate rapidă și recomandări personalizate — fără navigare manuală"
              tone="ai"
            />

            {/* Descoperire Medici/Clinici */}
            <PageCard
              pageName="Descoperire Medici/Clinici"
              icon="🔍"
              role="Marketplace pentru găsirea medicului sau clinicii potrivite"
              userActions={[
                "Vezi listă de medici/clinici",
                "Filtrează (specializare, oraș, rating)",
                "Compară opțiuni",
                "Accesează profilul"
              ]}
              value="Decizie rapidă — vezi opțiunile potrivite din start"
              tone="discovery"
            />

            {/* Profil Medic/Clinic */}
            <PageCard
              pageName="Profil Medic/Clinic"
              icon="👤"
              role="Aici se construiește 'încrederea' — prezentare completă"
              userActions={[
                "Vezi stil, expertiză, abordare",
                "Explorează servicii",
                "Verifică disponibilitatea",
                "Programează direct"
              ]}
              value="Încredere prin informații clare — știi cu cine lucrezi"
              tone="discovery"
            />

            {/* Programare */}
            <PageCard
              pageName="Programare"
              icon="📅"
              role="Booking fără fricțiune — simplu și eficient"
              userActions={[
                "Alege data (calendar)",
                "Vezi orele disponibile",
                "Confirmă instant"
              ]}
              value="Fără telefoane, fără confuzii — totul rapid și clar"
              tone="booking"
            />

            {/* Dashboard */}
            <PageCard
              pageName="Dashboard"
              icon="📊"
              role="Centrul de control personalizat pe rol (Pacient/Medic/Clinică)"
              userActions={[
                "Vezi programări și task-uri",
                "Accesează istoricul (consultații, documente)",
                "Gestionează datele personale",
                "Pornește consultația (medici) / Accesează dosarul (pacienți)"
              ]}
              value="Totul organizat într-un loc — nu mai cauți prin email/WhatsApp"
              tone="ui"
            />
          </div>

          {/* Flow vizual între pagini */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className="text-xs text-white/50 mb-3">Flow utilizator</div>
              <div className="flex flex-wrap justify-center items-center gap-2 text-xs text-white/40">
                <span className="px-3 py-1 rounded bg-white/5">Acasă</span>
                <span>→</span>
                <span className="px-3 py-1 rounded bg-white/5">AI <span className="text-white/30">(opțional)</span></span>
                <span>→</span>
                <span className="px-3 py-1 rounded bg-white/5">Descoperire</span>
                <span>→</span>
                <span className="px-3 py-1 rounded bg-white/5">Profil</span>
                <span>→</span>
                <span className="px-3 py-1 rounded bg-white/5">Programare</span>
                <span>→</span>
                <span className="px-3 py-1 rounded bg-white/5">Dashboard</span>
                <span>→</span>
                <span className="px-3 py-1 rounded bg-white/5">Consultație</span>
                <span>→</span>
                <span className="px-3 py-1 rounded bg-white/5">Istoric</span>
              </div>
            </div>
          </div>
        </FlowSection>

        {/* Programare */}
        <FlowSection
          title="3️⃣ Programarea: 'Aleg ziua, ora, și am confirmarea'"
          description="Booking fără fricțiune — simplu, clar, eficient"
        >
          <FlowRow
            nodes={[
              { title: "Alege data", description: "Calendar intuitiv", tone: "booking" },
              { title: "Vezi orele disponibile", description: "Slots în timp real", tone: "booking" },
              { title: "Confirmă programarea", description: "Instant, fără telefoane", tone: "booking" },
            ]}
          />
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <BenefitCard
              title="Beneficiu pentru Pacient"
              items={[
                "Programare fără telefoone",
                "Fără ping-pong",
                "Fără confuzii"
              ]}
            />
            <BenefitCard
              title="Beneficiu pentru Medic/Clinică"
              items={[
                "Booking ordonat",
                "Informații corecte",
                "Scade 'no-show'-ul și haosul"
              ]}
            />
          </div>
        </FlowSection>

        {/* Dashboard-uri */}
        <FlowSection
          title="4️⃣ Contul: 'ZenLink se adaptează la rolul meu'"
          description="După autentificare, fiecare vede un dashboard diferit, dar cu aceeași logică"
        >
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="text-lg font-semibold text-white mb-3">👤 Pacient</div>
              <FlowNode
                title="Scopul"
                description="Să fie îngrijit cu claritate, fără stres, cu informația la îndemână"
                tone="benefit"
              />
              <div className="space-y-2 mt-3">
                <div className="text-xs text-white/70">• Programări: viitoare + istoric</div>
                <div className="text-xs text-white/70">• Profil personal: date, preferințe</div>
                <div className="text-xs text-white/70">• Dosarul meu: analize, imagini, recomandări</div>
                <div className="text-xs text-white/70">• Experiență ghidată: pregătire + continuitate</div>
              </div>
              <div className="text-xs text-cyan-300 mt-3 font-semibold">
                Valoare: Nu mai e "în întuneric" — are un fir logic al sănătății
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-lg font-semibold text-white mb-3">👨‍⚕️ Medic</div>
              <FlowNode
                title="Scopul"
                description="Să reducă timpul pierdut, să crească calitatea, să păstreze totul coerent"
                tone="benefit"
              />
              <div className="space-y-2 mt-3">
                <div className="text-xs text-white/70">• Lista programărilor (azi / săptămâna)</div>
                <div className="text-xs text-white/70">• Setarea disponibilității</div>
                <div className="text-xs text-white/70">• Consultation Workspace: context, notițe, draft</div>
                <div className="text-xs text-white/70">• Profil profesional</div>
              </div>
              <div className="text-xs text-cyan-300 mt-3 font-semibold">
                Valoare: Consultații mai bune, mai consistente, mai ușor de documentat
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-lg font-semibold text-white mb-3">🏥 Clinică</div>
              <FlowNode
                title="Scopul"
                description="Vizibilitate, organizare, overview, management simplu"
                tone="benefit"
              />
              <div className="space-y-2 mt-3">
                <div className="text-xs text-white/70">• Overview: programări, pacienți, activitate</div>
                <div className="text-xs text-white/70">• Secțiuni dedicate (medici, pacienți)</div>
                <div className="text-xs text-white/70">• AI / Insights: standardizare, trenduri, eficiență</div>
              </div>
              <div className="text-xs text-cyan-300 mt-3 font-semibold">
                Valoare: Clinică mai "digitală", mai coerentă, mai ușor de scalat
              </div>
            </div>
          </div>
        </FlowSection>

        {/* Flow-ul Consultației - Pregătire */}
        <FlowSection
          title="🎙️ Flow-ul Detaliat al Consultației — Etapa 1: Pregătirea"
          description="AI-ul ZenLink are acces la istoricul medical complet, psych profile, documente și consultații anterioare"
          highlight={true}
        >
          <FlowRow
            nodes={[
              { 
                title: "Medicul deschide consultația", 
                description: "Din dashboard → programare", 
                tone: "consultation" 
              },
              { 
                title: "AI-ul prezintă contextul", 
                description: "Istoric medical + Psych profile + Documente + Consultații anterioare", 
                tone: "ai" 
              },
              { 
                title: "Medicul poate edita prompt-ul", 
                description: "Adaugă focus, întrebări specifice, context suplimentar", 
                tone: "consultation" 
              },
              { 
                title: "Consultația e gata", 
                description: "Totul pregătit pentru început", 
                tone: "benefit" 
              },
            ]}
          />
        </FlowSection>

        {/* Flow-ul Consultației - În timpul */}
        <FlowSection
          title="🎙️ Etapa 2: În Timpul Consultației"
          description="Înregistrare audio + procesare în timp real"
          highlight={true}
        >
          <FlowRow
            nodes={[
              { 
                title: "Înregistrare audio începe", 
                description: "Conversația medic-pacient", 
                tone: "consultation" 
              },
              { 
                title: "AI procesează în timp real", 
                description: "Transcrie audio → text, identifică puncte cheie, structurare automată", 
                tone: "ai" 
              },
              { 
                title: "Medicul poate edita prompt-ul", 
                description: "Pe parcurs, dacă dorește să direcționeze analiza", 
                tone: "consultation" 
              },
              { 
                title: "AI-ul structurează", 
                description: "Organizează informațiile, identifică secțiuni logice, creează draft", 
                tone: "ai" 
              },
            ]}
          />
        </FlowSection>

        {/* Flow-ul Consultației - Analiza */}
        <FlowSection
          title="🎙️ Etapa 3: Analiza Avansată (După Consultație)"
          description="AI-ul face analiză completă: Structurare + Deep Thinking + Quick Thinking + Research"
          highlight={true}
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FlowNode
              title="1. Structurare"
              description="Organizează conversația, identifică secțiuni"
              tone="ai"
            />
            <FlowNode
              title="2. Deep Thinking"
              description="Analiză profundă, conectează cu istoric, identifică pattern-uri"
              tone="ai"
            />
            <FlowNode
              title="3. Quick Thinking"
              description="Rezumat rapid, puncte cheie"
              tone="ai"
            />
            <FlowNode
              title="4. Research"
              description="Verifică informații, context medical, recomandări bazate pe date"
              tone="ai"
            />
          </div>
          <div className="flex justify-center my-4">
            <FlowConnector vertical={true} />
          </div>
          <div className="text-center">
            <FlowNode
              title="AI generează Clarity Sheet-uri"
              description="Pentru pacient (limbaj simplu) + Pentru medic (tehnic, detaliat)"
              tone="benefit"
            />
          </div>
        </FlowSection>

        {/* Clarity Sheet-uri */}
        <FlowSection
          title="📋 Etapa 4: Clarity Sheet-urile"
          description="Două perspective: una pentru pacient (simplă), una pentru medic (tehnică)"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-lg font-semibold text-cyan-300 mb-3">Clarity Sheet pentru Pacient</div>
              <BenefitCard
                title="Conținut"
                items={[
                  "Ce s-a discutat (limbaj simplu)",
                  "Ce am înțeles despre problema ta",
                  "Ce urmează să faci (pași clari)",
                  "Ce să urmărești (semnale importante)",
                  "Când să revii (follow-up)"
                ]}
                tone="benefit"
              />
            </div>
            <div className="space-y-3">
              <div className="text-lg font-semibold text-cyan-300 mb-3">Clarity Sheet pentru Medic</div>
              <BenefitCard
                title="Conținut"
                items={[
                  "Rezumat tehnic al consultației",
                  "Observații clinice structurate",
                  "Recomandări și plan de tratament",
                  "Puncte de atenție pentru următoarea consultație",
                  "Notițe și observații personale"
                ]}
                tone="ai"
              />
            </div>
          </div>
        </FlowSection>

        {/* Salvarea și Accesul */}
        <FlowSection
          title="💾 Etapa 5: Salvarea și Accesul Ulterior"
          description="Totul este salvat și accesibil pentru amândoi — pacient și medic"
          highlight={true}
        >
          <FlowRow
            nodes={[
              { 
                title: "Consultația este salvată", 
                description: "Înregistrare audio + Transcriere + Clarity sheet-uri + Conversația cu AI", 
                tone: "benefit" 
              },
            ]}
          />
          <div className="flex justify-center my-4">
            <FlowConnector vertical={true} />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-lg font-semibold text-white mb-3">Dashboard Pacient</div>
              <BenefitCard
                title="Ce poate face"
                items={[
                  "Vezi consultația completă",
                  "Accesează clarity sheet",
                  "Poate edita clarity sheet",
                  "Accesează conversația cu AI"
                ]}
                tone="benefit"
              />
            </div>
            <div className="space-y-3">
              <div className="text-lg font-semibold text-white mb-3">Dashboard Medic</div>
              <BenefitCard
                title="Ce poate face"
                items={[
                  "Vezi consultația completă",
                  "Accesează clarity sheet",
                  "Poate edita clarity sheet",
                  "Accesează conversația cu AI"
                ]}
                tone="ai"
              />
            </div>
          </div>
        </FlowSection>

        {/* Paradigma ZenLink */}
        <FlowSection
          title="🧠 Paradigma ZenLink (Pentru Investitori)"
          description="ZenLink nu e doar 'încă o platformă de programări'. E o platformă construită pe 3 idei fundamentale"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <FlowNode
              title="1. Marketplace + Încredere"
              description="Descoperirea medicului/clinicii ca într-o experiență modernă: clară, comparabilă, umană"
              tone="discovery"
            />
            <FlowNode
              title="2. Booking fără Fricțiune"
              description="Programarea trebuie să fie o acțiune simplă, nu o negociere"
              tone="booking"
            />
            <FlowNode
              title="3. Consultație Asistată + Continuitate"
              description="Adevărata valoare: context, claritate, rezumat, documente, pași următori"
              tone="consultation"
            />
          </div>
        </FlowSection>

        {/* Valoarea Adăugată */}
        <FlowSection
          title="💡 Valoarea Adăugată pentru Fiecare Rol"
          description="De ce ZenLink face diferența pentru fiecare tip de utilizator"
        >
          <div className="grid lg:grid-cols-3 gap-6">
            <BenefitCard
              title="Pentru Pacient"
              items={[
                "Claritate totală — știe exact ce s-a întâmplat și ce urmează",
                "Acces permanent — poate reveni la consultație oricând",
                "Control — poate edita clarity sheet-ul",
                "Continuitate — toate consultațiile sunt conectate logic"
              ]}
              tone="benefit"
            />
            <BenefitCard
              title="Pentru Medic"
              items={[
                "Eficiență — AI-ul face structurarea și analiza",
                "Calitate — consultațiile sunt documentate consistent",
                "Context — vede istoricul complet înainte de consult",
                "Flexibilitate — poate edita prompt-ul și clarity sheet-ul",
                "Organizare — totul este salvat și accesibil"
              ]}
              tone="ai"
            />
            <BenefitCard
              title="Pentru Clinică"
              items={[
                "Standardizare — toate consultațiile urmează același format",
                "Calitate — documentație consistentă și profesională",
                "Insights — poate analiza pattern-uri în consultații",
                "Scalabilitate — procesul este automatizat și eficient"
              ]}
              tone="consultation"
            />
          </div>
        </FlowSection>

        {/* Concluzie */}
        <FlowSection
          title="🎯 Concluzie: De ce ZenLink este diferit"
          description="Un ecosistem complet, de la prima căutare până la follow-up"
        >
          <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-3xl p-8 border border-white/20">
            <div className="space-y-4 text-white/90">
              <p className="text-lg">
                ZenLink nu este doar o platformă de programări. Este un <strong className="text-cyan-300">ecosistem complet</strong> care:
              </p>
              <ul className="space-y-3 ml-4">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <span><strong className="text-cyan-300">Începe cu descoperirea</strong> — marketplace modern și clar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <span><strong className="text-cyan-300">Facilitează programarea</strong> — fără fricțiune, fără confuzie</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <span><strong className="text-cyan-300">Asistă consultația</strong> — AI-ul ajută la structurare, analiză, claritate</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">4️⃣</span>
                  <span><strong className="text-cyan-300">Asigură continuitate</strong> — totul este salvat, accesibil, și conectat</span>
                </li>
              </ul>
              <p className="text-lg mt-6 pt-6 border-t border-white/20">
                <strong className="text-cyan-300">Rezultatul:</strong> O experiență completă care aduce valoare reală pentru pacienți, medici și clinici.
              </p>
            </div>
          </div>
        </FlowSection>

        {/* Diagramă mare - Parcursul pacientului */}
        <FlowSection
          title="📊 ZenLink — Parcursul pacientului de la simptom la continuitate medicală"
          description="Diagramă completă a workflow-ului — de la primul simptom până la follow-up"
          highlight={true}
        >
          <div className="overflow-x-auto">
            <div className="min-w-[1400px]">
              {/* Header cu coloane */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                <div className="text-center">
                  <div className="text-xs font-semibold text-white/80 mb-1">1️⃣ INTRARE</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-white/80 mb-1">2️⃣ AI (TRIJ)</div>
                  <div className="text-[10px] text-white/50">Opțional</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-white/80 mb-1">3️⃣ DESCOPERIRE</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-white/80 mb-1">4️⃣ PROGRAMARE</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-white/80 mb-1">5️⃣ CONSULTAȚIE</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-white/80 mb-1">6️⃣ ANALIZĂ AI</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-white/80 mb-1">7️⃣ CONTINUITATE</div>
                </div>
              </div>

              {/* START */}
              <div className="mb-4 text-center">
                <div className="inline-block px-6 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-semibold text-sm">
                  START
                </div>
                <div className="mt-2 text-white/40">⬇</div>
              </div>

              {/* Swimlane 1: PACIENT */}
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-32 flex-shrink-0">
                    <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-center">
                      <div className="text-lg mb-1">👤</div>
                      <div className="text-xs font-semibold text-white">PACIENT</div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-7 gap-2">
                    {/* Coloana 1 */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 space-y-1">
                      <div className="text-[10px] text-white/70">• Are o problemă / simptom</div>
                      <div className="text-[10px] text-white/70">• Deschide ZenLink</div>
                    </div>
                    {/* Coloana 2 */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Descrie simptomele</div>
                    </div>
                    {/* Coloana 3 */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Caută medici/clinici</div>
                      <div className="text-[10px] text-white/70">• Compară profiluri</div>
                    </div>
                    {/* Coloana 4 */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Alege dată și oră</div>
                      <div className="text-[10px] text-white/70">• Confirmă programarea</div>
                    </div>
                    {/* Coloana 5 */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Participă la consultație</div>
                    </div>
                    {/* Coloana 6 */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <div className="text-[10px] text-white/40">—</div>
                    </div>
                    {/* Coloana 7 */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Revine la informații</div>
                      <div className="text-[10px] text-white/70">• Urmează recomandările</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swimlane 2: PLATFORMA ZENLINK */}
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-32 flex-shrink-0">
                    <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3 text-center">
                      <div className="text-lg mb-1">💻</div>
                      <div className="text-xs font-semibold text-white">PLATFORMA ZENLINK</div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-7 gap-2">
                    {/* Coloana 1 */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Pagina Acasă</div>
                      <div className="text-[10px] text-white/70">• Opțiuni: AI sau Caută</div>
                    </div>
                    {/* Coloana 2 */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Afișează recomandări</div>
                    </div>
                    {/* Coloana 3 */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Filtre</div>
                      <div className="text-[10px] text-white/70">• Profiluri detaliate</div>
                    </div>
                    {/* Coloana 4 */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Afișează sloturi</div>
                      <div className="text-[10px] text-white/70">• Confirmă instant</div>
                    </div>
                    {/* Coloana 5 */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <div className="text-[10px] text-white/40">—</div>
                    </div>
                    {/* Coloana 6 */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <div className="text-[10px] text-white/40">—</div>
                    </div>
                    {/* Coloana 7 */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Salvează consultația</div>
                      <div className="text-[10px] text-white/70">• Creează istoric</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swimlane 3: AI ZENLINK */}
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-32 flex-shrink-0">
                    <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 text-center">
                      <div className="text-lg mb-1">🤖</div>
                      <div className="text-xs font-semibold text-white">AI ZENLINK</div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-7 gap-2">
                    {/* Coloana 1 */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <div className="text-[10px] text-white/40">—</div>
                    </div>
                    {/* Coloana 2 */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 space-y-1">
                      <div className="text-[10px] text-white/70">• Pune întrebări ghidate</div>
                      <div className="text-[10px] text-white/70">• Clarifică problema</div>
                      <div className="text-[10px] text-white/70">• Sugerează specializări</div>
                    </div>
                    {/* Coloana 3 */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <div className="text-[10px] text-white/40">—</div>
                    </div>
                    {/* Coloana 4 */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <div className="text-[10px] text-white/40">—</div>
                    </div>
                    {/* Coloana 5 */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 space-y-1">
                      <div className="text-[10px] text-white/70">• Oferă context medical</div>
                      <div className="text-[10px] text-white/70">• Transcrie conversația</div>
                      <div className="text-[10px] text-white/70">• Structurează notițe</div>
                    </div>
                    {/* Coloana 6 */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 space-y-1">
                      <div className="text-[10px] text-white/70">• Analizează discuția</div>
                      <div className="text-[10px] text-white/70">• Creează rezumat</div>
                      <div className="text-[10px] text-white/70">• Generează recomandări</div>
                      <div className="text-[10px] text-white/70">• Clarity Sheet pacient</div>
                      <div className="text-[10px] text-white/70">• Clarity Sheet medic</div>
                    </div>
                    {/* Coloana 7 */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <div className="text-[10px] text-white/40">—</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swimlane 4: MEDIC / CLINICĂ */}
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-32 flex-shrink-0">
                    <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-3 text-center">
                      <div className="text-lg mb-1">👨‍⚕️</div>
                      <div className="text-xs font-semibold text-white">MEDIC / CLINICĂ</div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-7 gap-2">
                    {/* Coloana 1 */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <div className="text-[10px] text-white/40">—</div>
                    </div>
                    {/* Coloana 2 */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <div className="text-[10px] text-white/40">—</div>
                    </div>
                    {/* Coloana 3 */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Are profil profesional</div>
                    </div>
                    {/* Coloana 4 */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Primește programarea</div>
                    </div>
                    {/* Coloana 5 */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Începe consultația</div>
                    </div>
                    {/* Coloana 6 */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <div className="text-[10px] text-white/40">—</div>
                    </div>
                    {/* Coloana 7 */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Accesează istoricul la următorul consult</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swimlane 5: ISTORIC MEDICAL */}
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-32 flex-shrink-0">
                    <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-3 text-center">
                      <div className="text-lg mb-1">📋</div>
                      <div className="text-xs font-semibold text-white">ISTORIC MEDICAL</div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-7 gap-2">
                    {/* Coloana 1-6 */}
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-2">
                        <div className="text-[10px] text-white/40">—</div>
                      </div>
                    ))}
                    {/* Coloana 7 */}
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2">
                      <div className="text-[10px] text-white/70">• Consultații salvate</div>
                      <div className="text-[10px] text-white/70">• Documente medicale</div>
                      <div className="text-[10px] text-white/70">• Clarity Sheet-uri</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Săgeți între coloane */}
              <div className="flex justify-center gap-2 mb-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex-1 flex items-center justify-center">
                    <div className="text-white/30 text-xl">→</div>
                  </div>
                ))}
              </div>

              {/* END - Follow-up */}
              <div className="text-center">
                <div className="inline-block px-6 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 font-semibold text-sm mb-2">
                  END
                </div>
                <div className="mt-2">
                  <div className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-white/20 text-white font-semibold">
                    Follow-up / Programare viitoare
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FlowSection>

        <footer className="text-center text-white/40 text-sm py-8 border-t border-white/10">
          <p>Document creat pentru prezentări către clienți și investitori</p>
          <p className="mt-1">Versiune non-tehnică — explicat pentru oameni, nu pentru cod</p>
        </footer>
      </div>
    </div>
  );
}
