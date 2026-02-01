const toneStyles = {
  route: "border-purple-500/30 bg-purple-500/10 text-purple-100",
  api: "border-blue-500/30 bg-blue-500/10 text-blue-100",
  storage: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  logic: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  ui: "border-white/10 bg-white/5 text-white/80",
};

function FlowNode({ title, description, meta, tone = "ui" }) {
  return (
    <div
      className={`min-w-[180px] max-w-[240px] rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-2xl ${toneStyles[tone]}`}
    >
      <div className="text-sm font-semibold text-white">{title}</div>
      {description && <div className="mt-1 text-xs text-white/70">{description}</div>}
      {meta && <div className="mt-2 text-[10px] uppercase tracking-wider text-white/40">{meta}</div>}
    </div>
  );
}

function FlowConnector({ vertical = false }) {
  return (
    <div
      className={`rounded-full bg-white/20 ${vertical ? "h-8 w-[2px]" : "h-[2px] w-10"}`}
    />
  );
}

function FlowRow({ nodes }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {nodes.map((node, index) => (
        <div key={`${node.title}-${index}`} className="flex items-center gap-3">
          <FlowNode {...node} />
          {index < nodes.length - 1 && <FlowConnector />}
        </div>
      ))}
    </div>
  );
}

function FlowSection({ title, description, children }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {description && <p className="text-sm text-white/60">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function Flowchart() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px]" />
        <div className="absolute -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px]" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12 relative z-10">
        <header>
          <h1 className="text-4xl font-bold text-white">Site Flowchart</h1>
          <p className="text-white/60 mt-2">
            Mapped from the current frontend routes, context, and API calls.
          </p>
        </header>

        <FlowSection
          title="App Shell & Routing"
          description="From app bootstrap to route selection (App.tsx)."
        >
          <FlowRow
            nodes={[
              { title: "BrowserRouter", description: "App entry (main.tsx)", tone: "logic" },
              { title: "App.tsx", description: "Top-level routes", tone: "logic" },
              { title: "AuthProvider + AppointmentProvider", description: "Global state", tone: "logic" },
              { title: "Navbar", description: "Hidden on /authentication", tone: "ui" },
              { title: "Routes", description: "Public + protected", tone: "route" },
            ]}
          />
        </FlowSection>

        <FlowSection
          title="Public Pages & Navigation"
          description="Routes available without ProtectedRoute."
        >
          <FlowRow
            nodes={[
              { title: "Home", description: "/", tone: "route" },
              { title: "Doctors List", description: "/doctori", tone: "route" },
              { title: "Doctor Profile", description: "/doctor/:id", tone: "route" },
              { title: "Book Appointment", description: "/doctor/:id/book", tone: "route" },
            ]}
          />
          <FlowRow
            nodes={[
              { title: "Home", description: "/", tone: "route" },
              { title: "Clinics List", description: "/clinici", tone: "route" },
              { title: "Clinic Profile", description: "/clinic/:id", tone: "route" },
              { title: "Book Appointment Button", description: "No navigation wired", tone: "ui" },
            ]}
          />
          <FlowRow
            nodes={[
              { title: "Sign In", description: "/authentication/sign-in", tone: "route" },
              { title: "Sign Up", description: "/authentication/sign-up", tone: "route" },
            ]}
          />
        </FlowSection>

        <FlowSection
          title="Auth & Session"
          description="LocalStorage and backend integration in AuthContext."
        >
          <FlowRow
            nodes={[
              { title: "Sign Up Form", description: "Role + referral code", tone: "ui" },
              { title: "POST /api/auth/signup", description: "Backend validation", tone: "api" },
              { title: "Store user + token", description: "localStorage", tone: "storage" },
              { title: "Navigate /dashboard", description: "On success", tone: "route" },
            ]}
          />
          <FlowRow
            nodes={[
              { title: "Sign In Form", description: "Redirect to intended route", tone: "ui" },
              { title: "POST /api/auth/login", description: "Backend auth", tone: "api" },
              { title: "Fallback login", description: "localStorage users if backend down", tone: "storage" },
              { title: "Store user + token", description: "localStorage", tone: "storage" },
            ]}
          />
        </FlowSection>

        <FlowSection
          title="Booking Flow"
          description="AppointmentBookingPage and related API calls."
        >
          <FlowRow
            nodes={[
              { title: "Book Appointment", description: "/doctor/:id/book", tone: "route" },
              { title: "GET /api/users/doctors/:id", description: "Load doctor", tone: "api" },
              { title: "Select date", description: "Calendar", tone: "ui" },
              { title: "GET /api/availability/doctor/:id/date/:date", description: "Slots", tone: "api" },
              { title: "Select time", description: "Slot list", tone: "ui" },
              { title: "POST /api/appointments?patientId=...", description: "Create appointment", tone: "api" },
              { title: "Success → /dashboard", description: "After 2s", tone: "route" },
            ]}
          />
        </FlowSection>

        <FlowSection
          title="Dashboard Routing"
          description="ProtectedRoute + role-based dashboard switch."
        >
          <FlowRow
            nodes={[
              { title: "/dashboard", description: "ProtectedRoute", tone: "route" },
              { title: "DashboardRouter", description: "Role → view", tone: "logic" },
              { title: "PATIENT / DOCTOR / CLINIC", description: "Switch on role", tone: "logic" },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-white">Patient Dashboard</div>
              <FlowRow
                nodes={[
                  { title: "GET /api/appointments/patient/:id", description: "Appointments", tone: "api" },
                  { title: "PUT /api/users/:id", description: "Profile save", tone: "api" },
                  { title: "patientMedicalData-<id>", description: "Local medical data", tone: "storage" },
                ]}
              />
              <FlowRow
                nodes={[
                  { title: "Files: GET/POST", description: "/api/patient-files/patient/:id", tone: "api" },
                  { title: "Files: GET/PUT/DELETE", description: "/api/patient-files/:id", tone: "api" },
                  { title: "Files: reorder", description: "/api/patient-files/patient/:id/order", tone: "api" },
                ]}
              />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-white">Doctor Dashboard</div>
              <FlowRow
                nodes={[
                  { title: "GET /api/appointments/doctor/:id", description: "Appointments", tone: "api" },
                  { title: "GET /api/availability/doctor/:id", description: "Availability", tone: "api" },
                  { title: "POST /api/availability/doctor/:id", description: "Save slots", tone: "api" },
                ]}
              />
              <FlowRow
                nodes={[
                  { title: "PUT /api/users/:id", description: "Profile save", tone: "api" },
                  { title: "Start consult", description: "Go to /consult/:id", tone: "route" },
                ]}
              />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-white">Clinic Dashboard</div>
              <FlowRow
                nodes={[
                  { title: "Sections", description: "Overview / Doctors / Patients / AI", tone: "ui" },
                  { title: "GET /api/clinics/:id/patients", description: "AI tab only", tone: "api" },
                ]}
              />
            </div>
          </div>
        </FlowSection>

        <FlowSection
          title="Consultation Workspace"
          description="Doctor flow to live consultation tools."
        >
          <FlowRow
            nodes={[
              { title: "DoctorDashboard", description: "Start consult", tone: "route" },
              { title: "GET /api/appointments/:id/consultation-context", description: "Load context", tone: "api" },
              { title: "Live transcription", description: "Simulated entries", tone: "logic" },
              { title: "POST /api/appointments/:id/consultation-draft", description: "Auto-save", tone: "api" },
              { title: "Clarity + Patient View", description: "Panels", tone: "ui" },
              { title: "Close consult", description: "Stops listening", tone: "logic" },
            ]}
          />
        </FlowSection>
      </div>
    </div>
  );
}

