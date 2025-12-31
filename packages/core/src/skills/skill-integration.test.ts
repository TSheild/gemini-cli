/**
 * Integration test for skills feature using actual filesystem
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { SkillRegistry } from './skill-registry.js';
import { SkillLoader, getUserSkillsDir, getProjectSkillsDir } from './skill-loader.js';

describe('Skills Integration', () => {
  const userSkillsDir = getUserSkillsDir();
  const testSkillDir = path.join(userSkillsDir, 'integration-test-skill');
  const skillFilePath = path.join(testSkillDir, 'SKILL.md');

  beforeAll(async () => {
    // Create test skill directory and file
    await fs.mkdir(testSkillDir, { recursive: true });
    await fs.writeFile(skillFilePath, `---
name: integration-test-skill
description: A skill for integration testing
tags:
  - testing
  - integration
examples:
  - "Test the integration"
---

# Integration Test Skill

This skill is used for integration testing the skills feature.

## Instructions

When invoked, this skill helps test the full skills pipeline.
`);
  });

  afterAll(async () => {
    // Clean up test skill
    try {
      await fs.rm(testSkillDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should discover and load skills from filesystem', async () => {
    const registry = new SkillRegistry();
    const loader = new SkillLoader(userSkillsDir, getProjectSkillsDir(process.cwd()));

    await loader.loadSkills(registry);

    // Should have at least our test skill
    expect(registry.size()).toBeGreaterThanOrEqual(1);

    // Get our test skill
    const skill = registry.getSkill('integration-test-skill');
    expect(skill).toBeDefined();
    expect(skill?.name).toBe('integration-test-skill');
    expect(skill?.description).toBe('A skill for integration testing');
    expect(skill?.tags).toContain('testing');
    expect(skill?.tags).toContain('integration');
    expect(skill?.content).toContain('# Integration Test Skill');
  });

  it('should filter skills by tags', async () => {
    const registry = new SkillRegistry();
    const loader = new SkillLoader(userSkillsDir, getProjectSkillsDir(process.cwd()));

    await loader.loadSkills(registry);

    const testingSkills = registry.getSkillsByTags(['integration']);
    expect(testingSkills.length).toBeGreaterThanOrEqual(1);
    expect(testingSkills.some(s => s.name === 'integration-test-skill')).toBe(true);
  });

  it('should generate skills summary', async () => {
    const registry = new SkillRegistry();
    const loader = new SkillLoader(userSkillsDir, getProjectSkillsDir(process.cwd()));

    await loader.loadSkills(registry);

    const summary = registry.getSkillsSummary();
    expect(summary).toContain('integration-test-skill');
    expect(summary).toContain('A skill for integration testing');
  });
});
