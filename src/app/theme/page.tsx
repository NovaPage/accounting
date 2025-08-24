import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ThemePage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Buttons</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Typography</CardTitle></CardHeader>
        <CardContent>
          <h1 className="text-2xl font-bold">Heading</h1>
          <p className="text-muted-foreground">Muted foreground text example.</p>
        </CardContent>
      </Card>
    </div>
  );
}
