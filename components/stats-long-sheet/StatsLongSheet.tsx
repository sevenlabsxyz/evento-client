"use client";
import React from "react";
import { VisuallyHidden } from "@silk-hq/components";
import { LongSheet } from "./LongSheet";
import { X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./StatsLongSheet.css";

const CircularProgress = ({
  percentage,
  size = 80,
}: {
  percentage: number;
  size?: number;
}) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#6366f1"
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-indigo-600">
          {percentage}%
        </span>
      </div>
    </div>
  );
};

interface StatsLongSheetProps {
  trigger: React.ReactNode;
}

const StatsLongSheet = ({ trigger }: StatsLongSheetProps) => {
  // Mock data - in real app this would come from user's actual event data
  const stats = {
    events: 0,
    countries: 0,
    cities: 0,
    categories: 0,
    mutuals: 0,
    shared: 0,
    international: 0,
    domestic: 0,
  };

  return (
    <LongSheet.Root>
      <LongSheet.Trigger asChild>{trigger}</LongSheet.Trigger>
      <LongSheet.Portal>
        <LongSheet.View>
          <LongSheet.Backdrop />
          <LongSheet.Content>
            <article className="StatsLongSheet-article">
              {/* Header with gradient background */}
              <div className="StatsLongSheet-header">
                <LongSheet.Trigger action="dismiss" asChild>
                  <button className="StatsLongSheet-dismissTrigger">
                    <X className="StatsLongSheet-dismissIcon" />
                    <VisuallyHidden.Root>Dismiss Sheet</VisuallyHidden.Root>
                  </button>
                </LongSheet.Trigger>

                {/* Empty State Message */}
                <div className="StatsLongSheet-headerContent">
                  <LongSheet.Title className="StatsLongSheet-title" asChild>
                    <h1>No events recorded in your stats</h1>
                  </LongSheet.Title>
                  <p className="StatsLongSheet-subtitle">
                    We will calculate it as soon as your next event is completed
                  </p>

                  {/* Stats Grid */}
                  <div className="StatsLongSheet-statsGrid">
                    <div className="StatsLongSheet-statItem">
                      <div className="StatsLongSheet-statValue">{stats.events}</div>
                      <div className="StatsLongSheet-statLabel">Events</div>
                    </div>
                    <div className="StatsLongSheet-statItem">
                      <div className="StatsLongSheet-statValue">{stats.countries}</div>
                      <div className="StatsLongSheet-statLabel">Countries</div>
                    </div>
                    <div className="StatsLongSheet-statItem">
                      <div className="StatsLongSheet-statValue">{stats.cities}</div>
                      <div className="StatsLongSheet-statLabel">Cities</div>
                    </div>
                    <div className="StatsLongSheet-statItem">
                      <div className="StatsLongSheet-statValue">{stats.categories}</div>
                      <div className="StatsLongSheet-statLabel">Categories</div>
                    </div>
                    <div className="StatsLongSheet-statItem">
                      <div className="StatsLongSheet-statValue">{stats.mutuals}</div>
                      <div className="StatsLongSheet-statLabel">Mutuals</div>
                    </div>
                    <div className="StatsLongSheet-statItem">
                      <div className="StatsLongSheet-statValue">0</div>
                      <div className="StatsLongSheet-statLabel">Connections</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Cards */}
              <div className="StatsLongSheet-articleContent">
                {/* Total Card */}
                <div className="StatsLongSheet-card">
                  <div className="StatsLongSheet-cardHeader">
                    <h2 className="StatsLongSheet-cardTitle">Total</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share className="h-5 w-5 text-gray-600" />
                    </Button>
                  </div>

                  <div className="StatsLongSheet-totalStats">
                    <div className="StatsLongSheet-totalItem">
                      <div className="StatsLongSheet-totalValue StatsLongSheet-totalValue--primary">
                        {stats.events}
                      </div>
                      <div className="StatsLongSheet-totalLabel StatsLongSheet-totalLabel--primary">
                        Events
                      </div>
                    </div>
                    <div className="StatsLongSheet-totalItem">
                      <div className="StatsLongSheet-totalValue StatsLongSheet-totalValue--secondary">
                        {stats.mutuals}
                      </div>
                      <div className="StatsLongSheet-totalLabel StatsLongSheet-totalLabel--secondary">
                        Mutuals Met
                      </div>
                    </div>
                  </div>

                  {/* Progress Circles */}
                  <div className="StatsLongSheet-progressGrid">
                    <div className="StatsLongSheet-progressItem">
                      <CircularProgress percentage={stats.shared} />
                      <div className="StatsLongSheet-progressLabel">Shared</div>
                    </div>
                    <div className="StatsLongSheet-progressItem">
                      <CircularProgress percentage={stats.international} />
                      <div className="StatsLongSheet-progressLabel">International</div>
                    </div>
                    <div className="StatsLongSheet-progressItem">
                      <CircularProgress percentage={stats.domestic} />
                      <div className="StatsLongSheet-progressLabel">Domestic</div>
                    </div>
                  </div>
                </div>

                {/* Countries Card */}
                <div className="StatsLongSheet-card">
                  <div className="StatsLongSheet-cardHeader">
                    <h2 className="StatsLongSheet-cardTitle">Countries</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share className="h-5 w-5 text-gray-600" />
                    </Button>
                  </div>

                  <div className="StatsLongSheet-countriesContent">
                    <div className="StatsLongSheet-countriesStats">
                      <div className="StatsLongSheet-countriesLeft">
                        <div className="StatsLongSheet-countryItem">
                          <div className="StatsLongSheet-countryValue StatsLongSheet-countryValue--visited">
                            {stats.countries}
                          </div>
                          <div className="StatsLongSheet-countryLabel StatsLongSheet-countryLabel--visited">
                            Visited
                          </div>
                        </div>
                        <div className="StatsLongSheet-countryItem">
                          <div className="StatsLongSheet-countryValue StatsLongSheet-countryValue--total">
                            249
                          </div>
                          <div className="StatsLongSheet-countryLabel StatsLongSheet-countryLabel--total">
                            World total
                          </div>
                        </div>
                      </div>
                      <div className="StatsLongSheet-countriesRight">
                        <CircularProgress
                          percentage={
                            stats.countries > 0
                              ? Math.round((stats.countries / 249) * 100)
                              : 0
                          }
                          size={100}
                        />
                      </div>
                    </div>

                    <div className="StatsLongSheet-mostVisited">
                      <h3 className="StatsLongSheet-sectionTitle">Most visited</h3>
                      {/* Empty state for most visited countries */}
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full text-red-500 font-semibold"
                    >
                      Show Visited Countries
                    </Button>
                  </div>
                </div>

                {/* Event Categories Card */}
                <div className="StatsLongSheet-card">
                  <div className="StatsLongSheet-cardHeader">
                    <h2 className="StatsLongSheet-cardTitle">Event Categories</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share className="h-5 w-5 text-gray-600" />
                    </Button>
                  </div>

                  <div className="StatsLongSheet-categoriesStats">
                    <div className="StatsLongSheet-categoryItem">
                      <div className="StatsLongSheet-categoryValue StatsLongSheet-categoryValue--primary">
                        {stats.categories}
                      </div>
                      <div className="StatsLongSheet-categoryLabel StatsLongSheet-categoryLabel--primary">
                        Categories
                      </div>
                    </div>
                    <div className="StatsLongSheet-categoryItem">
                      <div className="StatsLongSheet-categoryValue StatsLongSheet-categoryValue--secondary">
                        {stats.mutuals}
                      </div>
                      <div className="StatsLongSheet-categoryLabel StatsLongSheet-categoryLabel--secondary">
                        Mutuals
                      </div>
                    </div>
                  </div>

                  <div className="StatsLongSheet-popularCategories">
                    <h3 className="StatsLongSheet-sectionTitle">
                      Popular categories
                    </h3>
                    <div className="StatsLongSheet-emptyState">
                      No event categories yet
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </LongSheet.Content>
        </LongSheet.View>
      </LongSheet.Portal>
    </LongSheet.Root>
  );
};

export { StatsLongSheet };