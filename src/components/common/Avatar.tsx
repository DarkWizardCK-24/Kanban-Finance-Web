interface Props {
  initials: string;
  size?: number;
  onClick?: () => void;
}

export function Avatar({ initials, size = 36, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1E3A8A] to-accent-cyan font-bold text-dark-bg shadow-md ring-2 ring-accent-cyan/30 transition-transform hover:scale-105 focus-ring"
    >
      <span style={{ fontSize: size * 0.42 }}>{initials}</span>
    </button>
  );
}
