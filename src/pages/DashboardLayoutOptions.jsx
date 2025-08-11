import React from 'react';
import SummaryCard from '../components/SummaryCard';
import '../styles/App.css';

// Sample data for demonstration
const sampleStats = {
  TOTAL: 14,
  ACTIVE: 14,
  PENDING: 0,
  RECENT: 5
};

export default function DashboardLayoutOptions() {
  return (
    <div className="p-6" style={{ background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Option 1: Constrained Grid with Max Width */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Option 1: Constrained Grid (Max Width 1200px)</h2>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard title="Total Employees" value={sampleStats.TOTAL} actionable />
              <SummaryCard title="Active Employees" value={sampleStats.ACTIVE} actionable />
              <SummaryCard title="Pending Leaves" value={sampleStats.PENDING} actionable />
              <SummaryCard title="Recently Onboarded" value={sampleStats.RECENT} actionable />
            </div>
          </div>
        </section>

        {/* Option 2: Fixed Width Cards with Flex */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Option 2: Fixed Width Cards (280px each)</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <div style={{ width: '280px' }}>
              <SummaryCard title="Total Employees" value={sampleStats.TOTAL} actionable />
            </div>
            <div style={{ width: '280px' }}>
              <SummaryCard title="Active Employees" value={sampleStats.ACTIVE} actionable />
            </div>
            <div style={{ width: '280px' }}>
              <SummaryCard title="Pending Leaves" value={sampleStats.PENDING} actionable />
            </div>
            <div style={{ width: '280px' }}>
              <SummaryCard title="Recently Onboarded" value={sampleStats.RECENT} actionable />
            </div>
          </div>
        </section>

        {/* Option 3: Auto-fit Grid with Min/Max Width */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Option 3: Auto-fit Grid (Min 250px, Max 300px)</h2>
          <div className="max-w-5xl mx-auto">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 300px))', 
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <SummaryCard title="Total Employees" value={sampleStats.TOTAL} actionable />
              <SummaryCard title="Active Employees" value={sampleStats.ACTIVE} actionable />
              <SummaryCard title="Pending Leaves" value={sampleStats.PENDING} actionable />
              <SummaryCard title="Recently Onboarded" value={sampleStats.RECENT} actionable />
            </div>
          </div>
        </section>

        {/* Option 4: Compact Cards Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Option 4: Compact Layout (220px cards)</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <div style={{ width: '220px' }}>
              <div className="summary-card actionable" style={{ padding: 'var(--space-4)' }}>
                <div className="summary-card-title" style={{ fontSize: 'var(--text-sm)' }}>Total Employees</div>
                <div className="summary-card-value" style={{ fontSize: 'var(--text-2xl)' }}>{sampleStats.TOTAL}</div>
              </div>
            </div>
            <div style={{ width: '220px' }}>
              <div className="summary-card actionable" style={{ padding: 'var(--space-4)' }}>
                <div className="summary-card-title" style={{ fontSize: 'var(--text-sm)' }}>Active Employees</div>
                <div className="summary-card-value" style={{ fontSize: 'var(--text-2xl)' }}>{sampleStats.ACTIVE}</div>
              </div>
            </div>
            <div style={{ width: '220px' }}>
              <div className="summary-card actionable" style={{ padding: 'var(--space-4)' }}>
                <div className="summary-card-title" style={{ fontSize: 'var(--text-sm)' }}>Pending Leaves</div>
                <div className="summary-card-value" style={{ fontSize: 'var(--text-2xl)' }}>{sampleStats.PENDING}</div>
              </div>
            </div>
            <div style={{ width: '220px' }}>
              <div className="summary-card actionable" style={{ padding: 'var(--space-4)' }}>
                <div className="summary-card-title" style={{ fontSize: 'var(--text-sm)' }}>Recently Onboarded</div>
                <div className="summary-card-value" style={{ fontSize: 'var(--text-2xl)' }}>{sampleStats.RECENT}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Option 5: Horizontal Card Layout */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Option 5: Horizontal Cards (More Info Display)</h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="summary-card actionable" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: 'var(--space-5)'
            }}>
              <div>
                <div className="summary-card-title">Total Employees</div>
                <div className="text-xs opacity-75">All registered staff</div>
              </div>
              <div className="summary-card-value">{sampleStats.TOTAL}</div>
            </div>
            <div className="summary-card actionable" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: 'var(--space-5)'
            }}>
              <div>
                <div className="summary-card-title">Active Employees</div>
                <div className="text-xs opacity-75">Currently working</div>
              </div>
              <div className="summary-card-value">{sampleStats.ACTIVE}</div>
            </div>
            <div className="summary-card actionable" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: 'var(--space-5)'
            }}>
              <div>
                <div className="summary-card-title">Pending Leaves</div>
                <div className="text-xs opacity-75">Awaiting approval</div>
              </div>
              <div className="summary-card-value">{sampleStats.PENDING}</div>
            </div>
            <div className="summary-card actionable" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: 'var(--space-5)'
            }}>
              <div>
                <div className="summary-card-title">Recently Onboarded</div>
                <div className="text-xs opacity-75">This month</div>
              </div>
              <div className="summary-card-value">{sampleStats.RECENT}</div>
            </div>
          </div>
        </section>

        {/* Current Layout for Comparison */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Current Layout (Full Width - Not Optimal)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard title="Total Employees" value={sampleStats.TOTAL} actionable />
            <SummaryCard title="Active Employees" value={sampleStats.ACTIVE} actionable />
            <SummaryCard title="Pending Leaves" value={sampleStats.PENDING} actionable />
            <SummaryCard title="Recently Onboarded" value={sampleStats.RECENT} actionable />
          </div>
        </section>

      </div>
    </div>
  );
}
