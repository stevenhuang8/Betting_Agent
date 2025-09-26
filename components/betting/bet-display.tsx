"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, DollarSign, Target, TrendingUp } from "lucide-react";

interface BetLeg {
  game: string;
  pick: string;
  odds: string;
  reasoning: string;
}

interface BetRecommendation {
  title: string;
  type: string;
  legs: BetLeg[];
  totalOdds: string;
  payout: string;
  stake?: string;
  confidence?: string;
}

interface Source {
  title: string;
  url: string;
}

interface BetDisplayProps {
  bets: BetRecommendation[];
  sources?: Source[];
}

export function BetDisplay({ bets, sources = [] }: BetDisplayProps) {
  const [expandedBets, setExpandedBets] = useState<Set<number>>(new Set([0])); // First bet expanded by default
  const [showSources, setShowSources] = useState(false);

  const toggleBet = (index: number) => {
    const newExpanded = new Set(expandedBets);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedBets(newExpanded);
  };

  return (
    <div className="space-y-4">
      {bets.map((bet, betIndex) => (
        <div key={betIndex} className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleBet(betIndex)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {expandedBets.has(betIndex) ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{bet.title}</h3>
                  <p className="text-sm text-gray-600">{bet.type}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-bold text-lg text-green-600">{bet.payout}</span>
                </div>
                <p className="text-sm text-gray-600">Odds: {bet.totalOdds}</p>
              </div>
            </div>
          </div>

          {expandedBets.has(betIndex) && (
            <div className="border-t bg-gray-50">
              <div className="p-4 space-y-4">
                {bet.legs.map((leg, legIndex) => (
                  <div key={legIndex} className="bg-white rounded-md p-3 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{leg.game}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-blue-700">{leg.pick}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{leg.odds}</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 mt-2">
                      <TrendingUp className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 leading-relaxed">{leg.reasoning}</p>
                    </div>
                  </div>
                ))}

                {bet.confidence && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-800">
                      Confidence Level: {bet.confidence}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {sources.length > 0 && (
        <div className="border rounded-lg bg-white shadow-sm">
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowSources(!showSources)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {showSources ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">
                  Sources ({sources.length})
                </span>
              </div>
            </div>
          </div>

          {showSources && (
            <div className="border-t bg-gray-50 p-4">
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      {source.title}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}