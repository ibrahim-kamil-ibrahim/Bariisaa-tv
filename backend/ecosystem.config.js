module.exports = {
  apps: [
    {
      name: 'naik-backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
