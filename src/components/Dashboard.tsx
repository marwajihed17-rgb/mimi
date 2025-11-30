import { FileText, Package, BarChart3, LogOut, User, FileCheck } from 'lucide-react';
import { Button } from './ui/button';
import logo from 'figma:asset/220dab80c3731b3a44f7ce1394443acd5caffa99.png';

interface DashboardProps {
  onNavigate: (page: 'invoice' | 'kdr' | 'ga' | 'kdri') => void;
  onLogout: () => void;
  username?: string;
  allowedModules?: string[];
}

export function Dashboard({ onNavigate, onLogout, username = 'User', allowedModules = [] }: DashboardProps) {
  const cards = [
    {
      id: 'invoice' as const,
      icon: FileText,
      title: 'Invoice Processing',
      description: 'Process invoices with n8n automation',
    },
    {
      id: 'kdr' as const,
      icon: Package,
      title: 'KDR Processing',
      description: 'Manage KDR workflows efficiently',
    },
    {
      id: 'ga' as const,
      icon: BarChart3,
      title: 'GA Processing',
      description: 'Analytics and reporting automation',
    },
    {
      id: 'kdri' as const,
      icon: FileCheck,
      title: 'KDR Invoicing',
      description: 'KDR invoicing workflows and automation',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a3144] bg-[#0f1419]/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="Retaam Solutions" className="h-10" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1f2e]/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A90F5] to-[#C74AFF] flex items-center justify-center animated-gradient">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-sm">{username}</span>
            </div>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white hover:bg-[#1a1f2e] gap-2 h-9 px-3"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {cards.map((card) => {
            const Icon = card.icon;
            const enabled = allowedModules.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => enabled && onNavigate(card.id)}
                disabled={!enabled}
                className={`bg-[#1a1f2e]/80 backdrop-blur-sm border border-[#2a3144] rounded-lg p-6 transition-all group ${
                  enabled ? 'hover:border-[#3a4154] hover:bg-[#1a1f2e]/90' : 'opacity-50 cursor-not-allowed pointer-events-none'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4A90F5] to-[#C74AFF] flex items-center justify-center animated-gradient">
                    <Icon className={`w-6 h-6 text-white ${enabled ? '' : 'blur-[1px]'}`} />
                  </div>
                  <div>
                    <h3 className={`text-white mb-1 ${enabled ? '' : 'blur-[0.5px]'}`}>{card.title}</h3>
                    <p className={`text-gray-400 text-sm ${enabled ? '' : 'blur-[0.5px]'}`}>{card.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
      
      {/* Signature */}
      <div className="fixed bottom-4 right-4">
        <div className="flex items-center gap-4">
          <div className="h-0.5 w-64 bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] animated-gradient"></div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">PAA--Solutions Tool</p>
            <p className="text-gray-500 text-xs">WWW.PAA-Solutions.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
