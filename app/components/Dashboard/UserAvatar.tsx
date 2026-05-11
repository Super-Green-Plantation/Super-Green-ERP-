export function UserAvatar({ seed, className = "w-8 h-8" }: { seed: string, className?: string }) {

  return (
    <img
      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=transparent`}
      alt="avatar"
      className={`bg-muted/30 ${className}`}
    />
  );
}