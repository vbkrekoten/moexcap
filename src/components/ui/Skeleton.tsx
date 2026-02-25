interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = 'h-40' }: SkeletonProps) {
  return <div className={`skeleton ${className} w-full rounded-lg`} />;
}
