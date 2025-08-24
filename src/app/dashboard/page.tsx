import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card>
        <CardHeader><CardTitle>KPI One</CardTitle></CardHeader>
        <CardContent className="text-3xl font-bold">42</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>KPI Two</CardTitle></CardHeader>
        <CardContent className="text-3xl font-bold">97%</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent>All systems nominal.</CardContent>
      </Card>
    </div>
  );
}
