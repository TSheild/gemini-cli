/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { skillsCommand } from './skillsCommand.js';
import { type CommandContext, CommandKind } from './types.js';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';
import { MessageType } from '../types.js';
import { SkillRegistry } from '@google/gemini-cli-core';
import type { DiscoveredSkill } from '@google/gemini-cli-core';

describe('skillsCommand', () => {
  let mockContext: CommandContext;
  let mockSkillRegistry: SkillRegistry;

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
    mockSkillRegistry = new SkillRegistry();
    mockContext = createMockCommandContext({
      services: {
        config: {
          getSkillRegistry: () => mockSkillRegistry,
        },
      },
      ui: {
        addItem: vi.fn(),
      },
    } as unknown as CommandContext);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have the correct command properties', () => {
    expect(skillsCommand.name).toBe('skills');
    expect(skillsCommand.kind).toBe(CommandKind.BUILT_IN);
    expect(skillsCommand.description).toContain('List available agent skills');
  });

  describe('when no skills are available', () => {
    it('should show help message about adding skills', async () => {
      await skillsCommand.action!(mockContext, '');

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.INFO,
          text: expect.stringContaining('No skills available'),
        }),
        expect.any(Number),
      );
    });

    it('should show instructions for adding skills', async () => {
      await skillsCommand.action!(mockContext, '');

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('~/.gemini/skills/'),
        }),
        expect.any(Number),
      );

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('.gemini/skills/'),
        }),
        expect.any(Number),
      );
    });
  });

  describe('when skills are available', () => {
    beforeEach(() => {
      mockSkillRegistry.registerSkill(createSkill('skill-a', {
        description: 'First skill description',
      }));
      mockSkillRegistry.registerSkill(createSkill('skill-b', {
        description: 'Second skill description',
        extensionName: 'my-extension',
      }));
    });

    it('should list all available skills', async () => {
      await skillsCommand.action!(mockContext, '');

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.INFO,
          text: expect.stringContaining('skill-a'),
        }),
        expect.any(Number),
      );

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('First skill description'),
        }),
        expect.any(Number),
      );
    });

    it('should show extension name for extension skills', async () => {
      await skillsCommand.action!(mockContext, '');

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('my-extension'),
        }),
        expect.any(Number),
      );
    });
  });

  describe('when viewing a specific skill', () => {
    beforeEach(() => {
      mockSkillRegistry.registerSkill(createSkill('detailed-skill', {
        description: 'A skill with lots of details',
        path: '/home/user/.gemini/skills/detailed-skill',
        tags: ['testing', 'demo'],
        examples: ['Use this when you want to test'],
        content: '# Detailed Skill\n\nFollow these instructions...',
      }));
    });

    it('should show skill details when skill name is provided', async () => {
      await skillsCommand.action!(mockContext, 'detailed-skill');

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.INFO,
          text: expect.stringContaining('detailed-skill'),
        }),
        expect.any(Number),
      );

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('A skill with lots of details'),
        }),
        expect.any(Number),
      );
    });

    it('should show skill path', async () => {
      await skillsCommand.action!(mockContext, 'detailed-skill');

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('/home/user/.gemini/skills/detailed-skill'),
        }),
        expect.any(Number),
      );
    });

    it('should show skill tags', async () => {
      await skillsCommand.action!(mockContext, 'detailed-skill');

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('testing'),
        }),
        expect.any(Number),
      );
    });

    it('should show skill examples', async () => {
      await skillsCommand.action!(mockContext, 'detailed-skill');

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Use this when you want to test'),
        }),
        expect.any(Number),
      );
    });

    it('should show content preview', async () => {
      await skillsCommand.action!(mockContext, 'detailed-skill');

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Follow these instructions'),
        }),
        expect.any(Number),
      );
    });

    it('should show error for non-existent skill', async () => {
      await skillsCommand.action!(mockContext, 'non-existent');

      expect(mockContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.ERROR,
          text: expect.stringContaining('not found'),
        }),
        expect.any(Number),
      );
    });
  });

  describe('when skill registry is not available', () => {
    it('should show error message', async () => {
      const noRegistryContext = createMockCommandContext({
        services: {
          config: {
            getSkillRegistry: () => null,
          },
        },
        ui: {
          addItem: vi.fn(),
        },
      } as unknown as CommandContext);

      await skillsCommand.action!(noRegistryContext, '');

      expect(noRegistryContext.ui.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.ERROR,
          text: expect.stringContaining('Could not retrieve skill registry'),
        }),
        expect.any(Number),
      );
    });
  });
});
