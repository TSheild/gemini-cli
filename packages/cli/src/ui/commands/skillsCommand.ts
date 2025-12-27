/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type CommandContext,
  type SlashCommand,
  CommandKind,
} from './types.js';
import { MessageType } from '../types.js';

export const skillsCommand: SlashCommand = {
  name: 'skills',
  description: 'List available agent skills. Usage: /skills [skill_name]',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string): Promise<void> => {
    const skillName = args?.trim();

    const skillRegistry = context.services.config?.getSkillRegistry();
    if (!skillRegistry) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: 'Could not retrieve skill registry.',
        },
        Date.now(),
      );
      return;
    }

    const skills = skillRegistry.getAllSkills();

    // If a skill name is provided, show detailed info for that skill
    if (skillName) {
      const skill = skillRegistry.getSkill(skillName);
      if (!skill) {
        context.ui.addItem(
          {
            type: MessageType.ERROR,
            text: `Skill "${skillName}" not found. Use /skills to list all available skills.`,
          },
          Date.now(),
        );
        return;
      }

      let message = `\u001b[36m${skill.name}\u001b[0m\n\n`;
      message += `\u001b[33mDescription:\u001b[0m ${skill.description}\n\n`;
      message += `\u001b[33mPath:\u001b[0m ${skill.path}\n`;

      if (skill.extensionName) {
        message += `\u001b[33mExtension:\u001b[0m ${skill.extensionName}\n`;
      }

      if (skill.tags && skill.tags.length > 0) {
        message += `\u001b[33mTags:\u001b[0m ${skill.tags.join(', ')}\n`;
      }

      if (skill.examples && skill.examples.length > 0) {
        message += `\n\u001b[33mExamples:\u001b[0m\n`;
        skill.examples.forEach((example) => {
          message += `  - ${example}\n`;
        });
      }

      message += `\n\u001b[33mContent Preview:\u001b[0m\n`;
      const preview =
        skill.content.length > 500
          ? skill.content.substring(0, 500) + '...'
          : skill.content;
      const previewLines = preview.split('\n');
      previewLines.forEach((line) => {
        message += `  ${line}\n`;
      });

      context.ui.addItem({ type: MessageType.INFO, text: message }, Date.now());
      return;
    }

    // List all skills
    let message = 'Available Agent Skills:\n\n';

    if (skills.length > 0) {
      skills.forEach((skill) => {
        const extensionTag = skill.extensionName
          ? ` \u001b[90m[${skill.extensionName}]\u001b[0m`
          : '';
        message += `  - \u001b[36m${skill.name}\u001b[0m${extensionTag}\n`;
        message += `    \u001b[32m${skill.description}\u001b[0m\n\n`;
      });
    } else {
      message += '  No skills available.\n\n';
      message +=
        '  Skills can be added to:\n';
      message += '    - ~/.gemini/skills/ (user skills)\n';
      message += '    - .gemini/skills/ (project skills)\n\n';
      message +=
        '  Each skill is a folder containing a SKILL.md file with YAML frontmatter.\n';
      message += '  Example SKILL.md:\n\n';
      message += '    ---\n';
      message += '    name: my-skill\n';
      message += '    description: "Description of what this skill does"\n';
      message += '    ---\n\n';
      message += '    Instructions for the skill go here.\n';
    }

    message += '\nUse /skills [skill_name] to view details for a specific skill.\n';

    context.ui.addItem({ type: MessageType.INFO, text: message }, Date.now());
  },
};
