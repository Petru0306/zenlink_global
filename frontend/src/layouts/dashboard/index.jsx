import { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  User, Mail, Phone, Edit, FileText, Calendar, Clock, 
  History, CreditCard, Bot, Upload, Download, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Stethoscope
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');

  // Mock data
  const patientProfile = {
    firstName: 'Ion',
    lastName: 'Popescu',
    email: 'ion.popescu@email.com',
    phone: '+40 721 123 456',
    avatar: null
  };

  const medicalProfile = {
    bloodType: 'A+',
    allergies: 'Polen, Penicilină',
    chronicConditions: 'Hipertensiune',
    medications: 'Aspirin 100mg zilnic',
    insuranceNumber: 'RO123456789'
  };

  const files = [
    { id: 1, name: 'Analize Sange 2024.pdf', date: '15.01.2024', type: 'Analize' },
    { id: 2, name: 'Radiografie Torace.jpg', date: '10.12.2023', type: 'Imagini' },
    { id: 3, name: 'Rezultate EKG.pdf', date: '05.11.2023', type: 'Teste' }
  ];

  const ongoingTreatments = [
    { 
      id: 1, 
      name: 'Tratament Hipertensiune', 
      doctor: 'Dr. Alina Ion',
      startDate: '01.12.2023',
      progress: 75,
      nextCheckup: '15.02.2024'
    }
  ];

  const appointments = {
    active: [
      { id: 1, doctor: 'Dr. Gabriela Sofiniuc', date: '20.02.2024', time: '10:00', type: 'Cardiologie' }
    ],
    completed: [
      { id: 2, doctor: 'Dr. Alina Ion', date: '15.01.2024', time: '14:30', type: 'Consult General' }
    ]
  };

  const consultations = [
    { 
      id: 1, 
      doctor: 'Dr. Alina Ion', 
      date: '15.01.2024', 
      diagnosis: 'Hipertensiune arterială ușoară',
      notes: 'Tensiune arterială: 140/90. Recomandat tratament și monitorizare.',
      prescription: 'Aspirin 100mg zilnic, măsurători zilnice'
    }
  ];

  const subscription = {
    hasAISubscription: true,
    plan: 'AI Pro',
    startDate: '01.01.2024',
    endDate: '31.12.2024',
    features: ['Chat AI', 'Analiză Profil Medical', 'Analiză Tratament', 'Analiză Fisiere']
  };

  const tabs = [
    { id: 'profile', label: 'Profil Pacient', icon: User },
    { id: 'medical', label: 'Profil Medical', icon: Stethoscope },
    { id: 'files', label: 'Fișiere', icon: FileText },
    { id: 'treatments', label: 'Tratamente', icon: Clock },
    { id: 'appointments', label: 'Programări', icon: Calendar },
    { id: 'history', label: 'Istoric', icon: History },
    { id: 'subscription', label: 'Abonament', icon: CreditCard },
    { id: 'ai', label: 'Asistent AI', icon: Bot }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-2xl font-semibold">Profil Pacient</h2>
              <Button className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Editează Profilul
              </Button>
            </div>
            
            <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#5B8DEF] to-[#4169E1] flex items-center justify-center text-white text-4xl font-bold">
                    {patientProfile.firstName[0]}{patientProfile.lastName[0]}
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-[#a3aed0] text-sm">Nume</label>
                    <p className="text-white text-lg font-semibold">{patientProfile.lastName}</p>
                  </div>
                  <div>
                    <label className="text-[#a3aed0] text-sm">Prenume</label>
                    <p className="text-white text-lg font-semibold">{patientProfile.firstName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <label className="text-[#a3aed0] text-sm">Email</label>
                      <p className="text-white">{patientProfile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-400" />
                    <div>
                      <label className="text-[#a3aed0] text-sm">Telefon</label>
                      <p className="text-white">{patientProfile.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'medical':
        return (
          <div className="space-y-6">
            <h2 className="text-white text-2xl font-semibold">Profilul Medical</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
                <h3 className="text-white text-lg font-semibold mb-4">Date inițiale (la crearea contului)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[#a3aed0] text-sm">Grupă Sânge</label>
                    <p className="text-white">{medicalProfile.bloodType}</p>
                  </div>
                  <div>
                    <label className="text-[#a3aed0] text-sm">Alergii</label>
                    <p className="text-white">{medicalProfile.allergies}</p>
                  </div>
                  <div>
                    <label className="text-[#a3aed0] text-sm">Condiții Cronice</label>
                    <p className="text-white">{medicalProfile.chronicConditions}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
                <h3 className="text-white text-lg font-semibold mb-4">Date introduse de medic</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[#a3aed0] text-sm">Medicație Curentă</label>
                    <p className="text-white">{medicalProfile.medications}</p>
                  </div>
                  <div>
                    <label className="text-[#a3aed0] text-sm">Număr Asigurare</label>
                    <p className="text-white">{medicalProfile.insuranceNumber}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'files':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-2xl font-semibold">Fișierele Pacientului</h2>
              <Button className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Încarcă Fișier
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <Card key={file.id} className="p-4 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <FileText className="w-8 h-8 text-blue-400 mb-2" />
                      <h3 className="text-white font-semibold mb-1">{file.name}</h3>
                      <p className="text-[#a3aed0] text-sm">{file.type}</p>
                      <p className="text-[#a3aed0] text-xs mt-2">{file.date}</p>
                    </div>
                    <Download className="w-5 h-5 text-blue-400 hover:text-blue-300 cursor-pointer" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'treatments':
        return (
          <div className="space-y-6">
            <h2 className="text-white text-2xl font-semibold">Tratamente Ongoing</h2>
            
            {ongoingTreatments.map((treatment) => (
              <Card key={treatment.id} className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white text-xl font-semibold mb-2">{treatment.name}</h3>
                    <p className="text-blue-400">Dr. {treatment.doctor}</p>
                  </div>
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#a3aed0] text-sm">Progres</span>
                      <span className="text-white font-semibold">{treatment.progress}%</span>
                    </div>
                    <div className="w-full bg-[#0f1f3d] rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] h-2 rounded-full transition-all"
                        style={{ width: `${treatment.progress}%` }}
                      />
                    </div>
                  </div>
                
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[#2d4a7c]">
                    <div>
                      <label className="text-[#a3aed0] text-sm">Data început</label>
                      <p className="text-white">{treatment.startDate}</p>
                    </div>
                    <div>
                      <label className="text-[#a3aed0] text-sm">Următorul control</label>
                      <p className="text-white">{treatment.nextCheckup}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case 'appointments':
        return (
          <div className="space-y-6">
            <h2 className="text-white text-2xl font-semibold">Programări</h2>
            
            <div>
              <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Active
              </h3>
              {appointments.active.map((apt) => (
                <Card key={apt.id} className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl mb-4 hover:border-blue-500/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white text-lg font-semibold mb-2">Dr. {apt.doctor}</h4>
                      <div className="space-y-1">
                        <p className="text-blue-400">{apt.type}</p>
                        <p className="text-[#a3aed0]">Data: {apt.date}</p>
                        <p className="text-[#a3aed0]">Ora: {apt.time}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
                      Vezi Detalii
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div>
              <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Finalizate
              </h3>
              {appointments.completed.map((apt) => (
                <Card key={apt.id} className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl mb-4 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white text-lg font-semibold mb-2">Dr. {apt.doctor}</h4>
                      <div className="space-y-1">
                        <p className="text-blue-400">{apt.type}</p>
                        <p className="text-[#a3aed0]">Data: {apt.date}</p>
                        <p className="text-[#a3aed0]">Ora: {apt.time}</p>
                      </div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <h2 className="text-white text-2xl font-semibold">Istoric Consultații</h2>
            
            {consultations.map((consult) => (
              <Card key={consult.id} className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white text-xl font-semibold mb-1">Dr. {consult.doctor}</h3>
                    <p className="text-[#a3aed0]">{consult.date}</p>
                  </div>
                  <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
                    Vezi Clear Sheet
                  </Button>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-[#2d4a7c]">
                  <div>
                    <label className="text-[#a3aed0] text-sm">Diagnostic</label>
                    <p className="text-white">{consult.diagnosis}</p>
                  </div>
                  <div>
                    <label className="text-[#a3aed0] text-sm">Notițe</label>
                    <p className="text-white">{consult.notes}</p>
                  </div>
                  <div>
                    <label className="text-[#a3aed0] text-sm">Prescripție</label>
                    <p className="text-white">{consult.prescription}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-6">
            <h2 className="text-white text-2xl font-semibold">Abonamentul Meu</h2>
            
            {subscription.hasAISubscription ? (
              <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-white text-2xl font-semibold mb-2">{subscription.plan}</h3>
                    <p className="text-blue-400">Abonament AI Activ</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-[#a3aed0] text-sm">Data început</label>
                    <p className="text-white text-lg">{subscription.startDate}</p>
                  </div>
                  <div>
                    <label className="text-[#a3aed0] text-sm">Data expirare</label>
                    <p className="text-white text-lg">{subscription.endDate}</p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-[#2d4a7c]">
                  <label className="text-[#a3aed0] text-sm mb-3 block">Funcționalități incluse:</label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {subscription.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-white">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl text-center">
                <XCircle className="w-16 h-16 text-[#a3aed0] mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">Nu ai abonament AI activ</h3>
                <p className="text-[#a3aed0] mb-6">Cumpără un abonament pentru acces la Asistent AI</p>
                <Button className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white">
                  Cumpără Abonament
                </Button>
              </Card>
            )}
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <h2 className="text-white text-2xl font-semibold">Asistent AI</h2>
            
            {subscription.hasAISubscription ? (
              <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#4169E1] flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-semibold">Chat AI</h3>
                    <p className="text-[#a3aed0]">Pune întrebări despre profilul tău medical</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-[#0f1f3d] rounded-2xl p-4">
                    <p className="text-white">Bună! Sunt asistentul tău AI medical. Cu ce te pot ajuta?</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-[#2d4a7c] text-[#a3aed0] hover:border-blue-500 hover:text-white"
                    >
                      Analizează profilul meu medical
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-[#2d4a7c] text-[#a3aed0] hover:border-blue-500 hover:text-white"
                    >
                      Analizează tratamentul meu curent
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-[#2d4a7c] text-[#a3aed0] hover:border-blue-500 hover:text-white"
                    >
                      Analizează fișierele mele medicale
                    </Button>
                  </div>
                </div>
                
                <div className="border-t border-[#2d4a7c] pt-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Scrie întrebarea ta..."
                      className="flex-1 bg-[#0f1f3d] border border-[#2d4a7c] rounded-xl px-4 py-2 text-white placeholder-[#a3aed0] focus:outline-none focus:border-blue-500"
                    />
                    <Button className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white">
                      Trimite
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl text-center">
                <Bot className="w-16 h-16 text-[#a3aed0] mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">Ai nevoie de abonament AI</h3>
                <p className="text-[#a3aed0] mb-6">Cumpără un abonament pentru a accesa Asistent AI</p>
                <Button className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white">
                  Cumpără Abonament
                </Button>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1437]">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-[#0f1f3d] border-r border-[#2d4a7c] p-6">
          <h1 className="text-white text-2xl font-semibold mb-8">Dashboard</h1>
          
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] text-white'
                      : 'text-[#a3aed0] hover:bg-[#1a2f5c] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="animate-fade-in">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
