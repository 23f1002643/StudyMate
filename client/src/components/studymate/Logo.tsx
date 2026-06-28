interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="gradient-brand rounded-xl h-9 w-9 flex items-center justify-center shadow-sm flex-shrink-0">
        <span className="text-white text-lg">✦</span>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-display text-lg font-bold gradient-text">StudyMate</span>
          <span className="text-[10px] text-muted-foreground">AI Learning Assistant</span>
        </div>
      )}
    </div>
  );
}
