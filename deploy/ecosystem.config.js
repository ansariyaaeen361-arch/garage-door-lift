// PM2 process file for the Garage Door Lift Node app.
// Run once on the VPS from the repo root: pm2 start deploy/ecosystem.config.js
// Then: pm2 save   (so it survives reboots, assuming `pm2 startup` was already run for your other MERN apps)

module.exports = {
  apps: [
    {
      name: 'garage-door-lift',
      cwd: __dirname + '/../server',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        // Change this if 3001 is already taken by another app — check with: pm2 list / ss -tlnp
        PORT: 3001
      }
    }
  ]
};
