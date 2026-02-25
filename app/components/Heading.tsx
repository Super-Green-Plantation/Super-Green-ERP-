interface HeadingProps {
  children: React.ReactNode;
  className?: string;
}

export default function Heading({ children, className = "" }: HeadingProps) {
  return (
    <h1
      className={`sm:text-2xl text-lg font-semibold md:text-3xl text-slate-900 tracking-tighter flex items-center gap-3 ${className}`}
    >
      {children}
    </h1>
  );
}