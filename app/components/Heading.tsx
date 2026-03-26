interface HeadingProps {
  children: React.ReactNode;
  className?: string;
}

export default function Heading({ children, className = "" }: HeadingProps) {
  return (
    <h1
      className={`sm:text-xl text-lg font-bold md:text-3xl
         text-foreground tracking-tighter flex items-center gap-3 ${className}         
         `}
    >
      {children}
    </h1>
  );
}
