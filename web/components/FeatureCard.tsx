import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';
import { cn } from '../lib/utils';

export interface FeatureCardProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  locked?: boolean;
  lockedMessage?: string;
  icon?: ReactNode;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  action,
  locked = false,
  lockedMessage = 'Premium feature',
  icon,
  className,
}: FeatureCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {locked && (
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span className="text-xs">{lockedMessage}</span>
            </div>
          )}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {action && (
        <CardContent>
          <Button
            onClick={action.onClick}
            disabled={action.disabled || locked}
            className="w-full"
            variant={locked ? 'outline' : 'default'}
          >
            {action.label}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

