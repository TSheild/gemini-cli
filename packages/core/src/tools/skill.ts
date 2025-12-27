/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Kind, BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import type { ToolInvocation, ToolResult } from './tools.js';
import { ToolErrorType } from './tool-error.js';
import type { SkillRegistry } from '../skills/skill-registry.js';

interface SkillToolParams {
  skill_name: string;
}

class SkillToolInvocation extends BaseToolInvocation<
  SkillToolParams,
  ToolResult
> {
  constructor(
    private readonly skillRegistry: SkillRegistry,
    params: SkillToolParams,
  ) {
    super(params);
  }

  getDescription(): string {
    return `Invoking skill: ${this.params.skill_name}`;
  }

  async execute(
    _signal: AbortSignal,
    _updateOutput?: (output: string) => void,
  ): Promise<ToolResult> {
    const skillName = this.params.skill_name;
    const skill = this.skillRegistry.getSkill(skillName);

    if (!skill) {
      const availableSkills = this.skillRegistry.getAllSkills();
      const skillList =
        availableSkills.length > 0
          ? availableSkills.map((s) => `- ${s.name}: ${s.description}`).join('\n')
          : 'No skills are currently available.';

      return {
        llmContent: `Error: Skill "${skillName}" not found.\n\nAvailable skills:\n${skillList}`,
        returnDisplay: `Skill not found: ${skillName}`,
        error: {
          message: `Skill "${skillName}" not found`,
          type: ToolErrorType.SKILL_NOT_FOUND,
        },
      };
    }

    // Return the skill's full content for the agent to use
    const output = `# Skill: ${skill.name}

${skill.description}

---

${skill.content}`;

    return {
      llmContent: output,
      returnDisplay: `Loaded skill: ${skill.name}`,
    };
  }
}

/**
 * Tool for invoking agent skills.
 * Skills provide specialized instructions for performing specific tasks.
 */
export class SkillTool extends BaseDeclarativeTool<SkillToolParams, ToolResult> {
  static readonly Name = 'Skill';

  constructor(private readonly skillRegistry: SkillRegistry) {
    super(
      SkillTool.Name,
      'Skill',
      `Invoke an agent skill to load specialized instructions for a task.

Skills are organized folders of instructions that teach you how to perform specific tasks more effectively.

When to use this tool:
- When the task matches a skill's description in the Available Skills list
- When you need specialized guidance for a particular domain or workflow
- When the user explicitly asks you to use a specific skill

The skill's full instructions will be returned and should be followed for the current task.

To see available skills, call this tool with a skill name. If the skill doesn't exist, you'll receive a list of available skills.`,
      Kind.Other,
      {
        type: 'object',
        properties: {
          skill_name: {
            type: 'string',
            description:
              'The name of the skill to invoke. Must match a skill from the Available Skills list.',
          },
        },
        required: ['skill_name'],
      },
      false, // isOutputMarkdown
      false, // canUpdateOutput
    );
  }

  protected createInvocation(
    params: SkillToolParams,
  ): ToolInvocation<SkillToolParams, ToolResult> {
    return new SkillToolInvocation(this.skillRegistry, params);
  }
}
