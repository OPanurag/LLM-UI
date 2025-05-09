import { Leaf } from 'lucide-react';
import type { FC } from 'react';

const Header: FC = () => {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex items-center gap-3">
        <Leaf className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Green Recipe Genie
        </h1>
      </div>
    </header>
  );
};

export default Header;
