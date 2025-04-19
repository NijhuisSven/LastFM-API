const chalk = require('chalk');

const log = {
  info: (message) => {
    console.log(chalk.blue('ℹ️  INFO: ') + chalk.cyan(message));
  },
  success: (message) => {
    console.log(chalk.green('✅ SUCCESS: ') + chalk.white(message));
  },
  warning: (message) => {
    console.log(chalk.yellow('⚠️ WARNING: ') + chalk.yellow(message));
  },
  error: (message) => {
    console.log(chalk.red('❌ ERROR: ') + chalk.redBright(message));
  },
  auth: (message) => {
    console.log(chalk.magenta('🔐 AUTH: ') + chalk.magentaBright(message));
  },
  api: (message) => {
    console.log(chalk.blue('🔄 API: ') + chalk.blueBright(message));
  },
  db: (message) => {
    console.log(chalk.green('💾 DB: ') + chalk.greenBright(message));
  },
  track: (trackData) => {
    console.log(chalk.cyan('🎵 TRACK: ') + chalk.white(`${trackData.artist} - ${trackData.track}`));
  }
};

module.exports = log;