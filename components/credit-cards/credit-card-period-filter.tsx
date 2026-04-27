import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MONTH_NAMES } from "@/lib/constants";

export function CreditCardPeriodFilter({ month, year }: { month: number; year: number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]" action="/cartoes">
          <div>
            <label className="mb-2 block text-sm font-medium">Mes da fatura</label>
            <Select name="month" defaultValue={String(month)}>
              {MONTH_NAMES.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Ano</label>
            <Input type="number" name="year" min="2000" max="2100" defaultValue={year} />
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto">
              Ver fatura
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
