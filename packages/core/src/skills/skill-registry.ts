/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DiscoveredSkill } from './types.js';

/**
 * Registry for managing agent skills.
 * Skills are loaded from user, project, and extension directories
 * and made available to the agent for enhanced task performance.
 */
export class SkillRegistry {
  private skills: Map<string, DiscoveredSkill> = new Map();

  /**
   * Registers a skill in the registry.
   * If a skill with the same name exists, it will be prefixed with the extension name.
   * @param skill - The skill to register
   */
  registerSkill(skill: DiscoveredSkill): void {
    if (this.skills.has(skill.name)) {
      if (skill.extensionName) {
        // Prefix with extension name to avoid conflicts
        const newName = `${skill.extensionName}:${skill.name}`;
        console.warn(
          `Skill with name "${skill.name}" is already registered. Renaming to "${newName}".`,
        );
        this.skills.set(newName, { ...skill, name: newName });
      } else {
        // User/project skills override existing ones
        console.warn(
          `Skill with name "${skill.name}" is already registered. Overwriting.`,
        );
        this.skills.set(skill.name, skill);
      }
    } else {
      this.skills.set(skill.name, skill);
    }
  }

  /**
   * Returns all registered skills sorted by name.
   */
  getAllSkills(): DiscoveredSkill[] {
    return Array.from(this.skills.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  /**
   * Gets a specific skill by name.
   * @param name - The name of the skill to retrieve
   */
  getSkill(name: string): DiscoveredSkill | undefined {
    return this.skills.get(name);
  }

  /**
   * Returns skills from a specific extension.
   * @param extensionName - The name of the extension
   */
  getSkillsByExtension(extensionName: string): DiscoveredSkill[] {
    const extensionSkills: DiscoveredSkill[] = [];
    for (const skill of this.skills.values()) {
      if (skill.extensionName === extensionName) {
        extensionSkills.push(skill);
      }
    }
    return extensionSkills.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Returns skills that match any of the given tags.
   * @param tags - Tags to filter by
   */
  getSkillsByTags(tags: string[]): DiscoveredSkill[] {
    const matchingSkills: DiscoveredSkill[] = [];
    for (const skill of this.skills.values()) {
      if (skill.tags?.some((tag) => tags.includes(tag))) {
        matchingSkills.push(skill);
      }
    }
    return matchingSkills.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Returns the number of registered skills.
   */
  size(): number {
    return this.skills.size;
  }

  /**
   * Clears all skills from the registry.
   */
  clear(): void {
    this.skills.clear();
  }

  /**
   * Removes all skills from a specific extension.
   * @param extensionName - The name of the extension
   */
  removeSkillsByExtension(extensionName: string): void {
    for (const [name, skill] of this.skills.entries()) {
      if (skill.extensionName === extensionName) {
        this.skills.delete(name);
      }
    }
  }

  /**
   * Checks if a skill exists in the registry.
   * @param name - The name of the skill
   */
  hasSkill(name: string): boolean {
    return this.skills.has(name);
  }

  /**
   * Removes a specific skill from the registry.
   * @param name - The name of the skill to remove
   * @returns true if the skill was removed, false if it didn't exist
   */
  removeSkill(name: string): boolean {
    return this.skills.delete(name);
  }

  /**
   * Gets a summary of all skills for system prompt injection.
   * This provides minimal context (name + description) for skill discovery.
   */
  getSkillsSummary(): string {
    const skills = this.getAllSkills();
    if (skills.length === 0) {
      return '';
    }

    const summaryLines = skills.map(
      (skill) => `- **${skill.name}**: ${skill.description}`,
    );

    return `## Available Skills

The following skills are available to help you perform specialized tasks:

${summaryLines.join('\n')}

To use a skill, invoke it using the Skill tool with the skill name. The skill's full instructions will be loaded when invoked.`;
  }
}
