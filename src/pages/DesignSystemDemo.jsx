import React, { useState } from 'react';
import '../styles/App.css';

const DesignSystemDemo = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="card-gradient">
        <div className="card-content text-center py-12">
          <h1 className="text-4xl font-bold mb-4">PayFlow Design System</h1>
          <p className="text-lg opacity-90">Modern Gradient Design Implementation</p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="h-20 rounded-lg mb-2" style={{background: 'var(--primary-gradient)'}}></div>
              <p className="text-sm font-medium">Primary Gradient</p>
            </div>
            <div className="text-center">
              <div className="h-20 bg-blue-500 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Secondary</p>
            </div>
            <div className="text-center">
              <div className="h-20 bg-green-400 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Success</p>
            </div>
            <div className="text-center">
              <div className="h-20 bg-yellow-400 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Warning</p>
            </div>
            <div className="text-center">
              <div className="h-20 bg-red-400 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Error</p>
            </div>
            <div className="text-center">
              <div className="h-20 bg-blue-400 rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Info</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Heading 1 - The quick brown fox</h1>
            <h2 className="text-3xl font-bold">Heading 2 - The quick brown fox</h2>
            <h3 className="text-2xl font-semibold">Heading 3 - The quick brown fox</h3>
            <h4 className="text-xl font-semibold">Heading 4 - The quick brown fox</h4>
            <p className="text-lg">Large paragraph text - The quick brown fox jumps over the lazy dog.</p>
            <p className="text-base">Body text - The quick brown fox jumps over the lazy dog.</p>
            <p className="text-sm">Small text - The quick brown fox jumps over the lazy dog.</p>
            <p className="text-xs">Extra small text - The quick brown fox jumps over the lazy dog.</p>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Buttons</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Primary Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <button className="btn btn-primary">Primary Button</button>
                <button className="btn btn-primary" disabled>Disabled Primary</button>
                <button className="btn btn-primary btn-sm">Small Primary</button>
                <button className="btn btn-primary btn-lg">Large Primary</button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Secondary Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <button className="btn btn-secondary">Secondary Button</button>
                <button className="btn btn-secondary" disabled>Disabled Secondary</button>
                <button className="btn btn-secondary btn-sm">Small Secondary</button>
                <button className="btn btn-secondary btn-lg">Large Secondary</button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Status Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <button className="btn btn-success">Success Button</button>
                <button className="btn btn-warning">Warning Button</button>
                <button className="btn btn-error">Error Button</button>
                <button className="btn btn-ghost">Ghost Button</button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-content">
                <h3 className="font-semibold mb-2">Basic Card</h3>
                <p className="text-gray-600">This is a basic card with default styling and hover effects.</p>
              </div>
            </div>

            <div className="card-gradient">
              <div className="card-content">
                <h3 className="font-semibold mb-2">Gradient Card</h3>
                <p className="opacity-90">This is a gradient card with overlay effects and white text.</p>
              </div>
            </div>

            <div className="summary-card actionable">
              <div className="summary-card-title">Summary Card</div>
              <div className="summary-card-value">125</div>
            </div>
          </div>
        </section>

        {/* Forms */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Form Elements</h2>
          <div className="max-w-md">
            <div className="form-group">
              <label className="form-label">Text Input</label>
              <input type="text" className="form-input" placeholder="Enter text here..." />
            </div>

            <div className="form-group">
              <label className="form-label">Email Input</label>
              <input type="email" className="form-input" placeholder="Enter email address..." />
            </div>

            <div className="form-group">
              <label className="form-label">Select Dropdown</label>
              <select className="form-select">
                <option>Choose an option</option>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Textarea</label>
              <textarea className="form-textarea" rows="4" placeholder="Enter description..."></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Input with Error</label>
              <input type="text" className="form-input" style={{borderColor: 'var(--error)'}} />
              <div className="form-error">This field is required</div>
            </div>

            <div className="form-group">
              <label className="form-label">Input with Help</label>
              <input type="text" className="form-input" />
              <div className="form-help">This is a help message</div>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <span className="badge badge-success">Success</span>
            <span className="badge badge-warning">Warning</span>
            <span className="badge badge-error">Error</span>
            <span className="badge badge-info">Info</span>
            <span className="badge badge-neutral">Neutral</span>
          </div>
        </section>

        {/* Tables */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Tables</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>John Doe</td>
                  <td>john@example.com</td>
                  <td>Manager</td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td>
                    <button className="btn btn-primary btn-sm">Edit</button>
                  </td>
                </tr>
                <tr>
                  <td>Jane Smith</td>
                  <td>jane@example.com</td>
                  <td>HR</td>
                  <td><span className="badge badge-warning">Pending</span></td>
                  <td>
                    <button className="btn btn-primary btn-sm">Edit</button>
                  </td>
                </tr>
                <tr>
                  <td>Bob Johnson</td>
                  <td>bob@example.com</td>
                  <td>Employee</td>
                  <td><span className="badge badge-error">Inactive</span></td>
                  <td>
                    <button className="btn btn-primary btn-sm">Edit</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Modal</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Open Modal
          </button>

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
              <div className="card w-full max-w-md">
                <div className="card-content">
                  <h3 className="text-xl font-semibold mb-4">Modal Title</h3>
                  <p className="text-gray-600 mb-6">
                    This is a modal dialog with consistent styling that matches the design system.
                  </p>
                  <div className="flex gap-3">
                    <button className="btn btn-primary flex-1">Confirm</button>
                    <button className="btn btn-ghost flex-1" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Layout Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Layout Components</h2>
          <div className="space-y-6">
            {/* Simulated Topbar */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <span className="font-bold text-xl" style={{
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>PayFlow</span>
                  <span className="font-semibold">Dashboard</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>John Doe</span>
                  <span className="text-xl cursor-pointer">🔔</span>
                  <span className="cursor-pointer">Profile ⬇️</span>
                  <button className="btn btn-ghost btn-sm">🚪 Logout</button>
                </div>
              </div>
            </div>

            {/* Simulated Sidebar */}
            <div className="h-64 rounded-lg overflow-hidden" style={{background: 'var(--primary-gradient)'}}>
              <div className="p-4 text-white">
                <div className="font-bold text-xl mb-6 text-center">PayFlow</div>
                <nav className="space-y-2">
                  <a href="#" className="block p-3 rounded-lg bg-white bg-opacity-20">🏠 Dashboard</a>
                  <a href="#" className="block p-3 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors">👥 Employees</a>
                  <a href="#" className="block p-3 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors">📝 Onboarding</a>
                  <a href="#" className="block p-3 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors">💰 Payroll</a>
                </nav>
              </div>
            </div>
          </div>
        </section>

        {/* Grid System */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Grid System</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="card">
                <div className="card-content text-center">1 Column</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <div className="card-content text-center">Column 1</div>
              </div>
              <div className="card">
                <div className="card-content text-center">Column 2</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="card">
                <div className="card-content text-center">Column 1</div>
              </div>
              <div className="card">
                <div className="card-content text-center">Column 2</div>
              </div>
              <div className="card">
                <div className="card-content text-center">Column 3</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="card">
                <div className="card-content text-center">Col 1</div>
              </div>
              <div className="card">
                <div className="card-content text-center">Col 2</div>
              </div>
              <div className="card">
                <div className="card-content text-center">Col 3</div>
              </div>
              <div className="card">
                <div className="card-content text-center">Col 4</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignSystemDemo;
