import { Network } from "lucide-react";

import { HudPanel } from "@/components/ArcadeChrome";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerProfile } from "@/components/PlayerProfile";
import { formatNumber } from "@/lib/formatters";
import { getRoster } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const employees = await getRoster();
  const accounts = employees.flatMap((employee) => employee.accounts);

  return (
    <div className="space-y-6">
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
      <HudPanel kicker="Social Accounts" title="Connector-ready handles" tone="teal" icon={Network}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const employee = employees.find((item) => item.id === account.employeeId);
            return (
              <div key={account.id} className="rounded-md border border-white/10 bg-black/30 p-3">
                <p className="font-semibold text-white">{account.handle}</p>
                <p className="text-sm text-muted-foreground">{employee?.name} - {account.platform}</p>
                <p className="mt-2 font-mono text-sm text-arcade-cyan">{formatNumber(account.followers)} followers</p>
              </div>
            );
          })}
        </div>
      </HudPanel>
    </div>
  );
}
