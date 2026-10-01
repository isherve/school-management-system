import { Card, CardContent } from '@/components/ui/card';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">This module is scaffolded and ready for implementation.</p>
          <p className="text-sm text-muted-foreground mt-2">Backend API routes and database models are in place.</p>
        </CardContent>
      </Card>
    </div>
  );
}
