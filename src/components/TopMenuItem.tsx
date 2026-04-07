import Link from 'next/link';
import { TopMenuItemProps } from '../../interface';

export default function TopMenuItem({ title, pageRef }: TopMenuItemProps) {
  return (
    <Link href={pageRef} className="btn-nav">
      {title}
    </Link>
  );
}