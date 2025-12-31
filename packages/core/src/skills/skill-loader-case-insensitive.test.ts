/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for case-insensitive SKILL.md file names
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { SkillRegistry } from './skill-registry.js';
import { SkillLoader, getUserSkillsDir, getProjectSkillsDir } from './skill-loader.js';

describe('SkillLoader Case-Insensitive File Names', () => {
  const userSkillsDir = getUserSkillsDir();
  const testBaseDir = path.join(userSkillsDir, 'case-insensitive-tests');
  let registry: SkillRegistry;

  beforeAll(async () => {
    await fs.mkdir(testBaseDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(testBaseDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  const skillContent = (name: string) => `---
name: ${name}
description: A skill loaded from ${name}
---

# ${name} Skill

Instructions for ${name}
`;

  it('should load SKILL.md (uppercase)', async () => {
    const skillDir = path.join(testBaseDir, 'uppercase-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillContent('uppercase-skill'));

    const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
    await loader.loadSkills(registry);

    const skill = registry.getSkill('uppercase-skill');
    expect(skill).toBeDefined();
    expect(skill?.name).toBe('uppercase-skill');
  });

  it('should load skill.md (lowercase)', async () => {
    const skillDir = path.join(testBaseDir, 'lowercase-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, 'skill.md'), skillContent('lowercase-skill'));

    const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
    await loader.loadSkills(registry);

    const skill = registry.getSkill('lowercase-skill');
    expect(skill).toBeDefined();
    expect(skill?.name).toBe('lowercase-skill');
  });

  it('should load Skill.md (mixed case)', async () => {
    const skillDir = path.join(testBaseDir, 'mixedcase-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, 'Skill.md'), skillContent('mixedcase-skill'));

    const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
    await loader.loadSkills(registry);

    const skill = registry.getSkill('mixedcase-skill');
    expect(skill).toBeDefined();
    expect(skill?.name).toBe('mixedcase-skill');
  });

  it('should prefer SKILL.md if multiple variants exist', async () => {
    const skillDir = path.join(testBaseDir, 'multiple-variants');
    await fs.mkdir(skillDir, { recursive: true });
    // Write both - SKILL.md should be preferred (loaded first)
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillContent('uppercase-variant'));
    await fs.writeFile(path.join(skillDir, 'skill.md'), skillContent('lowercase-variant'));

    const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
    await loader.loadSkills(registry);

    // SKILL.md should be loaded (it's first in the search order)
    const skill = registry.getSkill('uppercase-variant');
    expect(skill).toBeDefined();
    // lowercase-variant should NOT be loaded
    expect(registry.getSkill('lowercase-variant')).toBeUndefined();
  });

  it('should load all skills with different file name variants', async () => {
    // Create all three skills in their own directories
    const uppercaseDir = path.join(testBaseDir, 'test-uppercase');
    const lowercaseDir = path.join(testBaseDir, 'test-lowercase');
    const mixedDir = path.join(testBaseDir, 'test-mixed');

    await fs.mkdir(uppercaseDir, { recursive: true });
    await fs.mkdir(lowercaseDir, { recursive: true });
    await fs.mkdir(mixedDir, { recursive: true });

    await fs.writeFile(path.join(uppercaseDir, 'SKILL.md'), skillContent('test-uppercase'));
    await fs.writeFile(path.join(lowercaseDir, 'skill.md'), skillContent('test-lowercase'));
    await fs.writeFile(path.join(mixedDir, 'Skill.md'), skillContent('test-mixed'));

    const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
    await loader.loadSkills(registry);

    expect(registry.getSkill('test-uppercase')).toBeDefined();
    expect(registry.getSkill('test-lowercase')).toBeDefined();
    expect(registry.getSkill('test-mixed')).toBeDefined();
  });
});
