import { GraduationCap } from 'lucide-react';

interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="gradient-primary rounded-xl p-2 shadow-lg">
        <GraduationCap className="h-6 w-6 text-white" />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-display text-xl font-bold gradient-text">StudyMate</span>
          <span className="text-[10px] text-muted-foreground font-medium">AI Study Assistant</span>
        </div>
      )}
    </div>
  );
}
