import { useState } from 'react';
import { AnimatedLogo } from './AnimatedLogo';
import { Input } from './ui/input';
import { Button } from './ui/button';
import logo from 'figma:asset/220dab80c3731b3a44f7ce1394443acd5caffa99.png';

interface LoginSuccess {
  username: string;
  modules: string[];
}

interface LoginPageProps {
  onLogin: (payload: LoginSuccess) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const normalizeModule = (m: string) => {
    const k = m.trim().toLowerCase();
    if (k.includes('invoice')) return 'invoice';
    if (k.includes('kdr invoicing')) return 'kdri';
    if (k.includes('kdr processing')) return 'kdr';
    if (k === 'kdr') return 'kdr';
    if (k.includes('ga')) return 'ga';
    return '';
  };

  const parseCsv = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    const rows: string[][] = [];
    for (const line of lines) {
      const cells: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          cells.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      cells.push(cur.trim());
      rows.push(cells);
    }
    return rows;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const sheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL ||
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLkeLcybXule4nlT7mXMGoiErD9wnHIkqsq_1kHfe6HjemB7oy98zVKP0NyJ1pH_w3w1vVuFjEdDoX/pub?output=csv';
      const res = await fetch(sheetUrl);
      const csv = await res.text();
      const rows = parseCsv(csv);
      const dataRows = rows.slice(1);
      const match = dataRows.find((r) => {
        const u = r[1] || '';
        const p = r[2] || '';
        return u.toLowerCase() === username.toLowerCase() && p === password;
      });
      if (!match) {
        setError('Invalid credentials');
        return;
      }
      const rawModules = (match[3] || '')
        .split(',')
        .map((m) => normalizeModule(m))
        .filter(Boolean);
      onLogin({ username: match[1] || username, modules: Array.from(new Set(rawModules)) });
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-[#2a3144] rounded-lg p-8 shadow-2xl">
          {/* Logo and Title */}
          <div className="flex items-center justify-center mb-8">
            <img src={logo} alt="Retaam Solutions" className="h-16" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-white mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#242938] border-[#2a3144] text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#242938] border-[#2a3144] text-white placeholder:text-gray-500"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] hover:opacity-90 text-white h-11 animated-gradient"
            >
              Login
            </Button>
          </form>
        </div>
      </div>
      
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
