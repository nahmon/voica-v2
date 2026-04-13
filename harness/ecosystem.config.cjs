// harness/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'harness',
      script: 'dispatcher.js',
      cwd: '/Users/mh/voica-v2/harness',
      interpreter: 'node',
      restart_delay: 3000,
      max_restarts: 10,
      out_file: './logs/out.log',
      error_file: './logs/err.log',
      merge_logs: true,
      env_file: '/Users/mh/voica-v2/harness/.env',
    },
  ],
}
