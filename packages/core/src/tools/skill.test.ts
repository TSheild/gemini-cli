/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SkillTool } from './skill.js';
import { SkillRegistry } from '../skills/skill-registry.js';
import type { DiscoveredSkill } from '../skills/types.js';
import { ToolErrorType } from './tool-error.js';

describe('SkillTool', () => {
  let registry: SkillRegistry;
  let tool: SkillTool;

  const createSkill = (
    name: string,
    overrides: Partial<DiscoveredSkill> = {},
  ): DiscoveredSkill => ({
    name,
    description: overrides.description ?? `Description for ${name}`,
    content: overrides.content ?? `# ${name}\n\nThis is the content for ${name}.`,
    path: overrides.path ?? `/path/to/${name}`,
    ...overrides,
  });

  beforeEach(() => {
    registry = new SkillRegistry();
    tool = new SkillTool(registry);
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(SkillTool.Name).toBe('Skill');
      expect(tool.name).toBe('Skill');
    });

    it('should have schema with skill_name parameter', () => {
      const schema = tool.schema;
      expect(schema.name).toBe('Skill');
      expect(schema.parametersJsonSchema).toHaveProperty('properties');
      const properties = (schema.parametersJsonSchema as { properties: Record<string, unknown> }).properties;
      expect(properties).toHaveProperty('skill_name');
    });

    it('should have a description', () => {
      expect(tool.description).toContain('Invoke an agent skill');
    });
  });

  describe('execute', () => {
    it('should return skill content when skill exists', async () => {
      const skill = createSkill('test-skill', {
        description: 'A test skill for testing',
        content: '# Test Skill\n\nFollow these instructions...',
      });
      registry.registerSkill(skill);

      const invocation = tool.build({ skill_name: 'test-skill' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('# Skill: test-skill');
      expect(result.llmContent).toContain('A test skill for testing');
      expect(result.llmContent).toContain('Follow these instructions...');
      expect(result.returnDisplay).toBe('Loaded skill: test-skill');
      expect(result.error).toBeUndefined();
    });

    it('should return error when skill not found', async () => {
      const invocation = tool.build({ skill_name: 'non-existent' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('Error: Skill "non-existent" not found');
      expect(result.llmContent).toContain('No skills are currently available');
      expect(result.returnDisplay).toBe('Skill not found: non-existent');
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe(ToolErrorType.SKILL_NOT_FOUND);
    });

    it('should list available skills when skill not found', async () => {
      registry.registerSkill(createSkill('skill-a', { description: 'Does A' }));
      registry.registerSkill(createSkill('skill-b', { description: 'Does B' }));

      const invocation = tool.build({ skill_name: 'non-existent' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('skill-a: Does A');
      expect(result.llmContent).toContain('skill-b: Does B');
    });

    it('should handle skills with complex content', async () => {
      const complexContent = `# Complex Skill

## Prerequisites
- Node.js 18+
- npm or yarn

## Instructions

\`\`\`typescript
function example() {
  return 'Hello World';
}
\`\`\`

### Step 1
Do this first.

### Step 2
Do this second.`;

      registry.registerSkill(createSkill('complex-skill', {
        description: 'A skill with complex markdown content',
        content: complexContent,
      }));

      const invocation = tool.build({ skill_name: 'complex-skill' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.llmContent).toContain('```typescript');
      expect(result.llmContent).toContain('## Prerequisites');
      expect(result.llmContent).toContain('### Step 1');
    });

    it('should handle skills with tags and examples', async () => {
      registry.registerSkill(createSkill('tagged-skill', {
        description: 'A skill with metadata',
        tags: ['testing', 'demo'],
        examples: ['Use this skill when...'],
      }));

      const invocation = tool.build({ skill_name: 'tagged-skill' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.error).toBeUndefined();
      expect(result.returnDisplay).toBe('Loaded skill: tagged-skill');
    });

    it('should handle skill names with special characters', async () => {
      registry.registerSkill(createSkill('my-extension:special-skill', {
        description: 'A skill from an extension',
      }));

      const invocation = tool.build({ skill_name: 'my-extension:special-skill' });
      const result = await invocation.execute(new AbortController().signal);

      expect(result.error).toBeUndefined();
      expect(result.llmContent).toContain('# Skill: my-extension:special-skill');
    });
  });

  describe('getDescription', () => {
    it('should return description with skill name', () => {
      const invocation = tool.build({ skill_name: 'my-skill' });
      expect(invocation.getDescription()).toBe('Invoking skill: my-skill');
    });
  });

  describe('buildAndExecute', () => {
    it('should build and execute in one step', async () => {
      registry.registerSkill(createSkill('quick-skill', {
        description: 'A quick skill',
      }));

      const result = await tool.buildAndExecute(
        { skill_name: 'quick-skill' },
        new AbortController().signal,
      );

      expect(result.llmContent).toContain('# Skill: quick-skill');
      expect(result.error).toBeUndefined();
    });
  });
});
