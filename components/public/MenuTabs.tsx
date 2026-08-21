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
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
  const fallback = ['Menu not set yet'];

  return (
    <div>
      <style>{`
        @keyframes subtle-sparkle {
          0% {
            box-shadow: 0 4px 12px rgba(44, 94, 46, 0.08), inset 4px 0 0 #2C5E2E;
            background-color: #F2FCEE;
          }
          50% {
            box-shadow: 0 4px 24px rgba(74, 222, 128, 0.4), inset 4px 0 0 #4ADE80;
            background-color: #E8F5E9;
          }
          100% {
            box-shadow: 0 4px 12px rgba(44, 94, 46, 0.08), inset 4px 0 0 #2C5E2E;
            background-color: #F2FCEE;
          }
        }
        .row-today-sparkle {
          animation: subtle-sparkle 2.5s infinite ease-in-out;
          position: relative;
          z-index: 10;
          transform: scale(1);
          border-radius: 8px; /* So the inset shadow looks good */
        }
      `}</style>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A2E1A', marginBottom: 8, letterSpacing: '-0.02em' }}>Full Weekly Schedule</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ fontSize: 15, color: '#5C6E5C', margin: 0 }}>View all our meal options for the entire week at a glance.</p>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#E8A020', background: '#FFF7ED', padding: '4px 10px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {dateRange}
          </span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #E8E2D5', borderRadius: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ background: '#F8F9FA' }}>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 13, fontWeight: 800, color: '#1A2E1A', textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px', borderBottom: '2px solid #E8E2D5' }}>Day</th>
              {PACKAGES.map(pkg => (
                <th key={pkg.id} style={{ padding: '20px 16px', textAlign: 'left', fontSize: 14, fontWeight: 800, color: '#1A2E1A', width: `${100 / PACKAGES.length}%`, borderBottom: '2px solid #E8E2D5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{pkg.icon}</span>
                    {pkg.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, idx) => {
              const isToday = day === todayDayName;
              return (
                <tr key={day} className={isToday ? "row-today-sparkle" : ""} style={{ 
                  borderBottom: idx === DAYS.length - 1 ? 'none' : '1px solid #F0F0F0',
                  background: isToday ? 'transparent' : 'transparent', // handled by css animation if today
                }}>
                  <td style={{ 
                    padding: '24px', fontWeight: 800, color: isToday ? '#166534' : '#1A2E1A', 
                    borderRight: '1px solid #F0F0F0', verticalAlign: 'top', 
                    background: isToday ? 'transparent' : '#FDFDFD',
                  }}>
                    <div style={{ fontSize: 16 }}>{day}</div>
                    {isToday && (
                      <div style={{ display: 'inline-block', fontSize: 10, color: '#fff', background: '#2C5E2E', padding: '4px 8px', borderRadius: 6, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                        Today
                      </div>
                    )}
                  </td>
                  {PACKAGES.map(pkg => {
                    const rowData = menuRows.find(r => r.menu_type === pkg.menuType && r.meal_type === pkg.mealType && r.day_of_week === day);
                    const items = rowData?.items?.length ? rowData.items : fallback;
                    const isVegOverride = rowData?.is_veg_override;
                    return (
                      <td key={pkg.id} style={{ padding: '24px 16px', verticalAlign: 'top', borderRight: pkg.id !== PACKAGES[PACKAGES.length-1].id ? '1px dashed #F0F0F0' : 'none' }}>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {items.map((item, i) => (
                            <li key={i} style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.5, display: 'flex', gap: 8 }}>
                              <span style={{ color: '#A0AEC0' }}>•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        {isVegOverride && (
                          <div style={{ 
                            display: 'inline-block', marginTop: 12, padding: '4px 10px', 
                            background: '#EBF5EB', color: '#2C5E2E', fontSize: 11, fontWeight: 800, borderRadius: 100, border: '1px solid #C8D8C8'
                          }}>
                            🌿 Veg Only
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
