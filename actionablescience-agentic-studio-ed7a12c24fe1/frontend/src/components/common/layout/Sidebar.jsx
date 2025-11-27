// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

// 1. Corrected the import path for the logo
import logo from '../../../assets/images/logo.png';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        {/* 2. Used the imported 'logo' in an img tag */}
        <img src={logo} alt="Rezolve.ai Logo" className="sidebar-logo" />
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/agent-builder" className="nav-item">
          Agent Builder
        </NavLink>
        <NavLink to="/workflows" className="nav-item">
          Workflows
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;