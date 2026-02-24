import { Command } from 'commander';
import { registerProcessCommand } from './commands/process.js';

const program = new Command();

program
  .name('extracta')
  .version('0.1.0')
  .description(
    'AI-Powered Knowledge Extraction Engine — Transform documents into AI-ready knowledge',
  );

registerProcessCommand(program);

program.parse();
