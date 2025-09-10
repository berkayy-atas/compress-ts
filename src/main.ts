import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { performance } from 'perf_hooks';
import path from 'path';

async function measureExecutionTime(
  name: string,
  fn: () => Promise<any>
): Promise<void> {
  core.info(` ${name}...`);
  const startTime = performance.now();
  await fn();
  const endTime = performance.now();
  const durationInSeconds = ((endTime - startTime) / 1000).toFixed(2);
  core.info(` ${name} completed in ${durationInSeconds} seconds.`);
}

async function run(): Promise<void> {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const repository = process.env.GITHUB_REPOSITORY;

    if (!githubToken) {
      throw new Error('GITHUB_TOKEN is not set.');
    }
    if (!repository) {
      throw new Error('GITHUB_REPOSITORY is not set.');
    }

    const repoUrl = `https://x-access-token:${githubToken}@github.com/${repository}.git`;
    const cloneDir = 'repo-mirror';
    const tarFile = 'repo.tar';
    const zstFile = 'repo.tar.zst';

    await measureExecutionTime('Cloning repository with --mirror', async () => {
      await exec.exec('git',);
    });

    await measureExecutionTime('Creating tar archive', async () => {
      await exec.exec('tar',);
    });

    await measureExecutionTime('Compressing with zstd', async () => {
      await exec.exec('zstd', [tarFile, '-o', zstFile]);
    });

    core.info('🎉 Action completed successfully!');
    core.info(`Output file: ${zstFile}`);

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred.');
    }
  }
}

run();