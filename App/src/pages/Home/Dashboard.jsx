import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Activity, 
  Download,
  Search,
  Plus
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    {
      label: 'Total Revenue',
      value: '$45,231.89',
      desc: '+20.1% from last month',
      icon: <span className="stat-icon">$</span>
    },
    {
      label: 'Subscriptions',
      value: '+2350',
      desc: '+180.1% from last month',
      icon: <Users size={16} className="stat-icon" />
    },
    {
      label: 'Sales',
      value: '+12,234',
      desc: '+19% from last month',
      icon: <CreditCard size={16} className="stat-icon" />
    },
    {
      label: 'Active Now',
      value: '+573',
      desc: '+201 since last hour',
      icon: <Activity size={16} className="stat-icon" />
    }
  ];

  const recentSales = [
    { name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: '+$1,999.00', initials: 'OM' },
    { name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: '+$39.00', initials: 'JL' },
    { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: '+$299.00', initials: 'IN' },
    { name: 'William Kim', email: 'will@email.com', amount: '+$99.00', initials: 'WK' },
    { name: 'Sofia Davis', email: 'sofia.davis@email.com', amount: '+$39.00', initials: 'SD' }
  ];

  const chartData = [
    { label: 'Jan', height: '40%' },
    { label: 'Feb', height: '30%' },
    { label: 'Mar', height: '60%' },
    { label: 'Apr', height: '45%' },
    { label: 'May', height: '80%' },
    { label: 'Jun', height: '35%' },
    { label: 'Jul', height: '55%' },
    { label: 'Aug', height: '70%' },
    { label: 'Sep', height: '90%' },
    { label: 'Oct', height: '50%' },
    { label: 'Nov', height: '65%' },
    { label: 'Dec', height: '75%' }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-actions">
          <button className="btn-download">
            <Download size={16} style={{ marginRight: '8px' }} />
            Download
          </button>
        </div>
      </header>

      <nav className="dashboard-tabs">
        {['Overview', 'Analytics', 'Reports', 'Notifications'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-header">
              <span className="stat-label">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-desc">{stat.desc}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Overview</h2>
          </div>
          <div className="card-content">
            <div className="chart-container">
              {chartData.map((data, idx) => (
                <div key={idx} className="chart-bar-wrapper">
                  <div className="chart-bar" style={{ height: data.height }}></div>
                  <span className="chart-label">{data.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Sales</h2>
            <p className="card-subtitle">You made 265 sales this month.</p>
          </div>
          <div className="card-content">
            <div className="recent-sales-list">
              {recentSales.map((sale, idx) => (
                <div key={idx} className="sale-item">
                  <div className="sale-info">
                    <div className="avatar">{sale.initials}</div>
                    <div>
                      <p className="user-name">{sale.name}</p>
                      <p className="user-email">{sale.email}</p>
                    </div>
                  </div>
                  <div className="sale-amount">{sale.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
