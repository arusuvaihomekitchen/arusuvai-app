'use client';

import React, { useState } from 'react';
import MenuDayCard from './MenuDayCard';

interface MenuRow {
  menu_type: string;
  day_of_week: string;
  meal_type: string;
  items: string[];
  is_veg_override: boolean;
}

interface MenuTabsProps {
  menuRows: MenuRow[];
  dateRange: string;
}

const PACKAGES = [
  { id: 'veg_lunch', label: 'Veg Lunch', menuType: 'veg', mealType: 'Lunch', icon: '🌿' },
  { id: 'non_veg_lunch', label: 'Non-Veg Lunch', menuType: 'non_veg', mealType: 'Lunch', icon: '🍗' },
  { id: 'premium_lunch', label: 'Premium Non-Veg Lunch', menuType: 'premium_non_veg', mealType: 'Lunch', icon: '👑' },
  { id: 'veg_dinner', label: 'Veg Dinner', menuType: 'veg', mealType: 'Dinner', icon: '🌿' },
  { id: 'non_veg_dinner', label: 'Non-Veg Dinner', menuType: 'non_veg', mealType: 'Dinner', icon: '🍗' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MenuTabs({ menuRows, dateRange }: MenuTabsProps) {
  const [activeTab, setActiveTab] = useState(PACKAGES[0].id);
  const activePkg = PACKAGES.find(p => p.id === activeTab)!;

  // Filter rows for active package
  const activeRows = menuRows.filter(r => r.menu_type === activePkg.menuType && r.meal_type === activePkg.mealType);
  const byDay: Record<string, string[]> = {};
  const byDayVegOverride: Record<string, boolean> = {};
  for (const row of activeRows) {
    byDay[row.day_of_week] = row.items;
    byDayVegOverride[row.day_of_week] = row.is_veg_override;
  }
  const fallback = ['Menu not set yet'];

  return (
    <div>
      {/* Scrollable Tabs */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 16, marginBottom: 24
      }}>
        {PACKAGES.map(pkg => {
          const isActive = activeTab === pkg.id;
          return (
            <button
              key={pkg.id}
              onClick={() => setActiveTab(pkg.id)}
              style={{
                padding: '12px 24px',
                borderRadius: 100,
                border: '1.5px solid',
                borderColor: isActive ? '#2C5E2E' : '#E8E2D5',
                background: isActive ? '#2C5E2E' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#5C6E5C',
                fontSize: 14,
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>{pkg.icon}</span>
              {pkg.label}
            </button>
          );
        })}
      </div>

      {/* Grid Header */}
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C5E2E',
        marginBottom: 28, display: 'flex', alignItems: 'center', gap: 8
      }}>
        {activePkg.label} — {dateRange}
        <div style={{ flex: 1, height: 1, background: '#E8E2D5' }} />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 }}>
        {DAYS.map(day => (
          <MenuDayCard 
            key={day} 
            day={day} 
            items={byDay[day]?.length ? byDay[day] : fallback} 
            menuType={activePkg.menuType as any} 
            mealType={activePkg.mealType as any} 
            isVegOverride={byDayVegOverride[day] || false}
          />
        ))}
      </div>
    </div>
  );
}
