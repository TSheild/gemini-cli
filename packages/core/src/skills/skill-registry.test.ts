/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SkillRegistry } from './skill-registry.js';
import type { DiscoveredSkill } from './types.js';

describe('SkillRegistry', () => {
  let registry: SkillRegistry;

  const createSkill = (
    name: string,
    options?: Partial<DiscoveredSkill>,
  ): DiscoveredSkill => ({
    name,
    description: `Description for ${name}`,
    content: `Content for ${name}`,
    path: `/path/to/${name}`,
    ...options,
  });

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  describe('registerSkill', () => {
    it('should register a skill', () => {
      const skill = createSkill('test-skill');
      registry.registerSkill(skill);

      expect(registry.hasSkill('test-skill')).toBe(true);
      expect(registry.getSkill('test-skill')).toEqual(skill);
    });

    it('should overwrite skill with same name when no extension', () => {
      const skill1 = createSkill('test-skill', {
        description: 'First description',
      });
      const skill2 = createSkill('test-skill', {
        description: 'Second description',
      });

      registry.registerSkill(skill1);
      registry.registerSkill(skill2);

      expect(registry.size()).toBe(1);
      expect(registry.getSkill('test-skill')?.description).toBe(
        'Second description',
      );
    });

    it('should prefix skill name with extension name on conflict', () => {
      const skill1 = createSkill('test-skill');
      const skill2 = createSkill('test-skill', {
        extensionName: 'my-extension',
      });

      registry.registerSkill(skill1);
      registry.registerSkill(skill2);

      expect(registry.size()).toBe(2);
      expect(registry.hasSkill('test-skill')).toBe(true);
      expect(registry.hasSkill('my-extension:test-skill')).toBe(true);
    });
  });

  describe('getAllSkills', () => {
    it('should return all skills sorted by name', () => {
      registry.registerSkill(createSkill('zebra'));
      registry.registerSkill(createSkill('alpha'));
      registry.registerSkill(createSkill('beta'));

      const skills = registry.getAllSkills();

      expect(skills.length).toBe(3);
      expect(skills[0].name).toBe('alpha');
      expect(skills[1].name).toBe('beta');
      expect(skills[2].name).toBe('zebra');
    });

    it('should return empty array when no skills', () => {
      expect(registry.getAllSkills()).toEqual([]);
    });
  });

  describe('getSkill', () => {
    it('should return undefined for non-existent skill', () => {
      expect(registry.getSkill('non-existent')).toBeUndefined();
    });
  });

  describe('getSkillsByExtension', () => {
    it('should return skills from a specific extension', () => {
      registry.registerSkill(
        createSkill('skill1', { extensionName: 'ext-a' }),
      );
      registry.registerSkill(
        createSkill('skill2', { extensionName: 'ext-a' }),
      );
      registry.registerSkill(
        createSkill('skill3', { extensionName: 'ext-b' }),
      );
      registry.registerSkill(createSkill('skill4'));

      const extASkills = registry.getSkillsByExtension('ext-a');

      expect(extASkills.length).toBe(2);
      expect(extASkills.every((s) => s.extensionName === 'ext-a')).toBe(true);
    });

    it('should return empty array for non-existent extension', () => {
      expect(registry.getSkillsByExtension('non-existent')).toEqual([]);
    });
  });

  describe('getSkillsByTags', () => {
    it('should return skills matching any of the given tags', () => {
      registry.registerSkill(
        createSkill('skill1', { tags: ['python', 'backend'] }),
      );
      registry.registerSkill(
        createSkill('skill2', { tags: ['javascript', 'frontend'] }),
      );
      registry.registerSkill(
        createSkill('skill3', { tags: ['python', 'data'] }),
      );

      const pythonSkills = registry.getSkillsByTags(['python']);

      expect(pythonSkills.length).toBe(2);
      expect(pythonSkills.map((s) => s.name).sort()).toEqual([
        'skill1',
        'skill3',
      ]);
    });

    it('should return empty array when no skills match tags', () => {
      registry.registerSkill(
        createSkill('skill1', { tags: ['python'] }),
      );

      expect(registry.getSkillsByTags(['ruby'])).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.size()).toBe(0);
    });

    it('should return correct count', () => {
      registry.registerSkill(createSkill('skill1'));
      registry.registerSkill(createSkill('skill2'));
      registry.registerSkill(createSkill('skill3'));

      expect(registry.size()).toBe(3);
    });
  });

  describe('clear', () => {
    it('should remove all skills', () => {
      registry.registerSkill(createSkill('skill1'));
      registry.registerSkill(createSkill('skill2'));

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.getAllSkills()).toEqual([]);
    });
  });

  describe('removeSkillsByExtension', () => {
    it('should remove only skills from the specified extension', () => {
      registry.registerSkill(
        createSkill('skill1', { extensionName: 'ext-a' }),
      );
      registry.registerSkill(
        createSkill('skill2', { extensionName: 'ext-b' }),
      );
      registry.registerSkill(createSkill('skill3'));

      registry.removeSkillsByExtension('ext-a');

      expect(registry.size()).toBe(2);
      expect(registry.hasSkill('skill1')).toBe(false);
      expect(registry.hasSkill('skill2')).toBe(true);
      expect(registry.hasSkill('skill3')).toBe(true);
    });
  });

  describe('getSkillsSummary', () => {
    it('should return empty string when no skills', () => {
      expect(registry.getSkillsSummary()).toBe('');
    });

    it('should return formatted summary with all skills', () => {
      registry.registerSkill(
        createSkill('skill-a', { description: 'Does A things' }),
      );
      registry.registerSkill(
        createSkill('skill-b', { description: 'Does B things' }),
      );

      const summary = registry.getSkillsSummary();

      expect(summary).toContain('## Available Skills');
      expect(summary).toContain('**skill-a**');
      expect(summary).toContain('Does A things');
      expect(summary).toContain('**skill-b**');
      expect(summary).toContain('Does B things');
    });
  });
});
