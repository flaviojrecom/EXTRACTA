import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerProcessCommand } from '../../../src/cli/commands/process.js';

function createTestProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerProcessCommand(program);
  return program;
}

describe('CLI process command', () => {
  it('should parse default options', () => {
    const program = createTestProgram();
    const processCmd = program.commands.find((cmd) => cmd.name() === 'process');

    expect(processCmd).toBeDefined();
    expect(processCmd!.description()).toBe(
      'Process a document through the EXTRACTA pipeline',
    );
  });

  it('should accept --preset option with default rag', () => {
    const program = createTestProgram();
    const processCmd = program.commands.find((cmd) => cmd.name() === 'process')!;

    const presetOption = processCmd.options.find((opt) => opt.long === '--preset');
    expect(presetOption).toBeDefined();
    expect(presetOption!.defaultValue).toBe('rag');
  });

  it('should accept --format option with default md', () => {
    const program = createTestProgram();
    const processCmd = program.commands.find((cmd) => cmd.name() === 'process')!;

    const formatOption = processCmd.options.find((opt) => opt.long === '--format');
    expect(formatOption).toBeDefined();
    expect(formatOption!.defaultValue).toBe('md');
  });

  it('should accept --output option with default ./output', () => {
    const program = createTestProgram();
    const processCmd = program.commands.find((cmd) => cmd.name() === 'process')!;

    const outputOption = processCmd.options.find((opt) => opt.long === '--output');
    expect(outputOption).toBeDefined();
    expect(outputOption!.defaultValue).toBe('./output');
  });

  it('should accept --chunk-size option with default 750', () => {
    const program = createTestProgram();
    const processCmd = program.commands.find((cmd) => cmd.name() === 'process')!;

    const chunkOption = processCmd.options.find((opt) => opt.long === '--chunk-size');
    expect(chunkOption).toBeDefined();
    expect(chunkOption!.defaultValue).toBe('750');
  });

  it('should have --verbose and --dry-run flags', () => {
    const program = createTestProgram();
    const processCmd = program.commands.find((cmd) => cmd.name() === 'process')!;

    const verboseOption = processCmd.options.find((opt) => opt.long === '--verbose');
    const dryRunOption = processCmd.options.find((opt) => opt.long === '--dry-run');

    expect(verboseOption).toBeDefined();
    expect(dryRunOption).toBeDefined();
  });

  it('should have --no-cache flag', () => {
    const program = createTestProgram();
    const processCmd = program.commands.find((cmd) => cmd.name() === 'process')!;

    const cacheOption = processCmd.options.find((opt) => opt.long === '--no-cache');
    expect(cacheOption).toBeDefined();
  });
});
