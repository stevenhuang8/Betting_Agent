"use client";

import { cn } from "@/lib/utils";

export interface BetRecommendation {
  playerTeam: string;
  lineProp: string;
  amountBet: number;
  possibleWinnings: number;
  id?: string;
}

interface BettingTableProps {
  bets: BetRecommendation[];
  className?: string;
  title?: string;
}

export default function BettingTable({
  bets,
  className,
  title = "Recommended Bets"
}: BettingTableProps) {
  if (!bets || bets.length === 0) {
    return (
      <div className={cn("bg-gray-50 border border-gray-200 rounded-lg p-6", className)}>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">{title}</h3>
        <p className="text-gray-500">No betting recommendations available.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amountBet, 0);
  const totalPossibleWinnings = bets.reduce((sum, bet) => sum + bet.possibleWinnings, 0);

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team/Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player Prop/Line
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount Bet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Possible Winnings
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bets.map((bet, index) => (
              <tr key={bet.id || index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{bet.playerTeam}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{bet.lineProp}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {formatCurrency(bet.amountBet)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-green-600">
                    {formatCurrency(bet.possibleWinnings)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Bets:</span> {bets.length}
          </div>
          <div className="flex space-x-6">
            <div className="text-sm">
              <span className="font-medium text-gray-600">Total Amount:</span>{' '}
              <span className="font-semibold text-gray-900">{formatCurrency(totalBetAmount)}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-600">Total Potential:</span>{' '}
              <span className="font-semibold text-green-600">{formatCurrency(totalPossibleWinnings)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}