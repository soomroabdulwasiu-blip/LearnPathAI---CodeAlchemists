import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GitBranch, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-[#2D5BFF]/10 text-[#2D5BFF] flex items-center justify-center font-display font-black text-2xl shadow-xs">
        404
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
          The curriculum module or route you navigated to is not found in LearnPath AI.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate('/dashboard')} className="font-bold cursor-pointer">
          <Home className="w-4 h-4 mr-1.5" />
          <span>Dashboard</span>
        </Button>
        <Button variant="secondary" onClick={() => navigate('/roadmap')} className="cursor-pointer">
          <GitBranch className="w-4 h-4 mr-1.5 text-[#2D5BFF]" />
          <span>View Roadmap</span>
        </Button>
      </div>
    </div>
  );
};
