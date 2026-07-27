const fs = require('fs');
const path = require('path');

const pages = [
  'src/pages/user/DashboardHome.jsx',
  'src/pages/user/UpcomingLaunches.jsx',
  'src/pages/user/PreviousLaunches.jsx',
  'src/pages/user/PremiumPage.jsx',
  'src/pages/user/News.jsx',
  'src/pages/user/Profile.jsx',
  'src/pages/user/Settings.jsx',
  'src/pages/user/LaunchDetails.jsx',
  'src/pages/admin/AdminHome.jsx',
  'src/pages/admin/ManageLaunches.jsx',
  'src/pages/admin/CreateLaunch.jsx',
  'src/pages/admin/ManageUsers.jsx',
  'src/pages/admin/ManagePremium.jsx',
  'src/pages/admin/ManageNews.jsx',
  'src/pages/admin/Analytics.jsx',
  'src/pages/admin/Reports.jsx',
  'src/pages/admin/AdminSettings.jsx'
];

pages.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const componentName = path.basename(file, '.jsx');
  const content = `import React from 'react';

export default function ${componentName}() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl text-white font-display-lg mb-6">${componentName}</h1>
      <div className="glass-card p-6 border-white/5 rounded-2xl">
        <p className="text-on-surface-variant">Content for ${componentName} goes here.</p>
      </div>
    </div>
  );
}
`;

  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
    console.log(`Created ${file}`);
  }
});
