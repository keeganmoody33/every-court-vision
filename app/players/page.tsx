import { PlayerCard } from "@/components/PlayerCard";
import { PlayerProfile } from "@/components/PlayerProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/formatters";
import { getRoster } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const employees = await getRoster();
  const accounts = employees.flatMap((employee) => employee.accounts);

  return (
    <div className="space-y-6">
      <div>
        <p className="stat-label">Surface IQ Roster</p>
        <h2 className="text-2xl font-bold">Players</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {employees.map((employee) => (
          <PlayerCard key={employee.id} employee={employee} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {employees.map((employee) => (
          <PlayerProfile key={employee.id} employee={employee} />
        ))}
      </div>
      <Card className="border-white/10 bg-white/[0.045]">
        <CardHeader>
          <p className="stat-label">Social Accounts</p>
          <CardTitle>Connector-ready handles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const employee = employees.find((item) => item.id === account.employeeId);
            return (
              <div key={account.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                <p className="font-semibold text-white">{account.handle}</p>
                <p className="text-sm text-muted-foreground">{employee?.name} - {account.platform}</p>
                <p className="mt-2 font-mono text-sm text-primary">{formatNumber(account.followers)} followers</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
