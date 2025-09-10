import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import { performance } from 'perf_hooks';
import { existsSync } from 'fs';

async function measureExecutionTime(
  name: string,
  fn: () => Promise<any>
): Promise<void> {
  core.info(`🚀 ${name}...`);
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  const durationInSeconds = ((endTime - startTime) / 1000).toFixed(2);
  core.info(`✅ ${name} completed in ${durationInSeconds} seconds`);
}

async function run(): Promise<void> {
  try {
    // Get inputs
    const githubToken = core.getInput('github-token');
    const repository = process.env.GITHUB_REPOSITORY;

    if (!githubToken) {
      throw new Error('GitHub token is required');
    }
    if (!repository) {
      throw new Error('GITHUB_REPOSITORY environment variable is not set');
    }

    const repoUrl = `https://x-access-token:${githubToken}@github.com/${repository}.git`;
    const cloneDir = 'repo-mirror';
    const tarFile = 'repo.tar';
    const zstFile = 'repo.tar.zst';

    // Clean up any existing files
    if (existsSync(cloneDir)) {
      core.info('🧹 Cleaning up existing clone directory...');
      await io.rmRF(cloneDir);
    }
    if (existsSync(tarFile)) {
      await io.rmRF(tarFile);
    }
    if (existsSync(zstFile)) {
      await io.rmRF(zstFile);
    }

    // Clone repository with --mirror
    await measureExecutionTime('Cloning repository with --mirror', async () => {
      await exec.exec('git', ['clone', '--mirror', repoUrl, cloneDir]);
    });

    // Create tar archive
    await measureExecutionTime('Creating tar archive', async () => {
      await exec.exec('tar', [
        '-cf',
        tarFile,
        '-C',
        cloneDir,
        '.'
      ]);
    });

    // Compress with zstd
    await measureExecutionTime('Compressing with zstd', async () => {
      await exec.exec('zstd', [
        '-10',
        tarFile,
        '-o',
        zstFile
      ]);
    });

    // Get file size
    await measureExecutionTime('Getting file information', async () => {
      const { exitCode, stdout } = await exec.getExecOutput('ls', [
        '-lh',
        zstFile
      ], { silent: true });
      
      if (exitCode === 0) {
        core.info(`📦 Output file: ${stdout.trim()}`);
      }
    });

    core.info('🎉 Action completed successfully!');
    core.info(`💾 Final archive: ${zstFile}`);

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`❌ Action failed: ${error.message}`);
    } else {
      core.setFailed('❌ An unknown error occurred');
    }
  }
}

run();