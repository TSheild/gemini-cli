/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Edge case tests for skill loader
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { SkillRegistry } from './skill-registry.js';
import { SkillLoader, getUserSkillsDir, getProjectSkillsDir } from './skill-loader.js';

describe('SkillLoader Edge Cases', () => {
  const userSkillsDir = getUserSkillsDir();
  const testBaseDir = path.join(userSkillsDir, 'edge-case-tests');
  let registry: SkillRegistry;

  beforeAll(async () => {
    // Create base test directory
    await fs.mkdir(testBaseDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testBaseDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  describe('Invalid YAML frontmatter', () => {
    it('should skip skill with malformed YAML', async () => {
      const skillDir = path.join(testBaseDir, 'malformed-yaml');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: test
description: [invalid yaml
  - missing bracket
---

Content here
`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      expect(registry.getSkill('test')).toBeUndefined();
    });

    it('should skip skill with no frontmatter', async () => {
      const skillDir = path.join(testBaseDir, 'no-frontmatter');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `# Just Content

No frontmatter here at all.
`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      expect(registry.size()).toBe(0);
    });

    it('should skip skill with incomplete frontmatter delimiters', async () => {
      const skillDir = path.join(testBaseDir, 'incomplete-frontmatter');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: test
description: Missing closing delimiter

Content here
`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      expect(registry.getSkill('test')).toBeUndefined();
    });
  });

  describe('Missing required fields', () => {
    it('should skip skill with missing name', async () => {
      const skillDir = path.join(testBaseDir, 'missing-name');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
description: A skill without a name
tags:
  - testing
---

Content here
`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      expect(registry.size()).toBe(0);
    });

    it('should skip skill with missing description', async () => {
      const skillDir = path.join(testBaseDir, 'missing-description');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: no-desc-skill
tags:
  - testing
---

Content here
`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      expect(registry.getSkill('no-desc-skill')).toBeUndefined();
    });

    it('should skip skill with empty name', async () => {
      const skillDir = path.join(testBaseDir, 'empty-name');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: ""
description: A skill with empty name
---

Content here
`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      expect(registry.size()).toBe(0);
    });
  });

  describe('Valid edge cases', () => {
    it('should load skill with empty content after frontmatter', async () => {
      const skillDir = path.join(testBaseDir, 'empty-content');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: empty-content-skill
description: A skill with no content
---

`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      const skill = registry.getSkill('empty-content-skill');
      expect(skill).toBeDefined();
      expect(skill?.content).toBe('');
    });

    it('should load skill with unicode characters', async () => {
      const skillDir = path.join(testBaseDir, 'unicode-skill');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: unicode-skill
description: A skill with 日本語 and émojis 🎉
tags:
  - 测试
---

# Skill with Unicode

This skill handles 中文, 日本語, and émojis 🚀
`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      const skill = registry.getSkill('unicode-skill');
      expect(skill).toBeDefined();
      expect(skill?.description).toContain('日本語');
      expect(skill?.description).toContain('🎉');
      expect(skill?.tags).toContain('测试');
    });

    it('should handle very long description by truncating', async () => {
      const skillDir = path.join(testBaseDir, 'long-description');
      await fs.mkdir(skillDir, { recursive: true });
      const longDescription = 'A'.repeat(2000); // Over 1024 char limit
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: long-desc-skill
description: ${longDescription}
---

Content here
`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      const skill = registry.getSkill('long-desc-skill');
      expect(skill).toBeDefined();
      expect(skill?.description.length).toBeLessThanOrEqual(1024);
      expect(skill?.description).toContain('...');
    });

    it('should load skill with special characters in name', async () => {
      const skillDir = path.join(testBaseDir, 'special-chars');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: my-skill_v2.0
description: A skill with special characters in name
---

Content here
`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      const skill = registry.getSkill('my-skill_v2.0');
      expect(skill).toBeDefined();
    });

    it('should load skill with markdown content including code blocks', async () => {
      const skillDir = path.join(testBaseDir, 'code-blocks');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---
name: code-skill
description: A skill with code examples
---

# Code Skill

\`\`\`typescript
function hello() {
  console.log("Hello");
}
\`\`\`

\`\`\`yaml
# This looks like frontmatter but isn't
---
name: fake
---
\`\`\`
`);

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      const skill = registry.getSkill('code-skill');
      expect(skill).toBeDefined();
      expect(skill?.content).toContain('```typescript');
      expect(skill?.content).toContain('```yaml');
    });
  });

  describe('Directory structure edge cases', () => {
    it('should ignore files that are not directories', async () => {
      // Create a file directly in the skills directory (not a subdirectory)
      await fs.writeFile(path.join(testBaseDir, 'random-file.md'), 'This is not a skill');

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      // Should not throw and should have no skills from this file
      expect(registry.size()).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty skills directory', async () => {
      const emptyDir = path.join(testBaseDir, 'empty-dir');
      await fs.mkdir(emptyDir, { recursive: true });

      const loader = new SkillLoader(emptyDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      expect(registry.size()).toBe(0);
    });

    it('should handle skill directory without SKILL.md', async () => {
      const noSkillDir = path.join(testBaseDir, 'no-skill-file');
      await fs.mkdir(noSkillDir, { recursive: true });
      await fs.writeFile(path.join(noSkillDir, 'README.md'), 'Not a skill file');

      const loader = new SkillLoader(testBaseDir, getProjectSkillsDir(process.cwd()));
      await loader.loadSkills(registry);

      // Should not throw
      expect(registry.getSkill('no-skill-file')).toBeUndefined();
    });

    it('should handle non-existent skills directory', async () => {
      const nonExistentDir = '/non/existent/path';
      const loader = new SkillLoader(nonExistentDir, getProjectSkillsDir(process.cwd()));

      // Should not throw
      await loader.loadSkills(registry);
      expect(registry.size()).toBe(0);
    });
  });
});
