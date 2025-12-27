/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs, type Dirent } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'yaml';
import type { DiscoveredSkill, SkillFrontmatter } from './types.js';
import type { SkillRegistry } from './skill-registry.js';

const SKILL_FILE_NAME = 'SKILL.md';
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

interface SkillDirectory {
  path: string;
  extensionName?: string;
}

/**
 * Loads agent skills from filesystem directories.
 * Skills are folders containing a SKILL.md file with YAML frontmatter.
 */
export class SkillLoader {
  private readonly userSkillsDir: string;
  private readonly projectSkillsDir: string;
  private readonly extensionSkillsDirs: SkillDirectory[];

  constructor(
    userSkillsDir: string,
    projectSkillsDir: string,
    extensionSkillsDirs: SkillDirectory[] = [],
  ) {
    this.userSkillsDir = userSkillsDir;
    this.projectSkillsDir = projectSkillsDir;
    this.extensionSkillsDirs = extensionSkillsDirs;
  }

  /**
   * Discovers and loads all skills into the registry.
   * Skills are loaded in order: user → project → extensions
   * User and project skills take precedence over extension skills.
   */
  async loadSkills(registry: SkillRegistry): Promise<void> {
    // Load in order of precedence
    const skillDirs: SkillDirectory[] = [
      { path: this.userSkillsDir },
      { path: this.projectSkillsDir },
      ...this.extensionSkillsDirs,
    ];

    for (const dirInfo of skillDirs) {
      try {
        const skills = await this.discoverSkillsInDirectory(
          dirInfo.path,
          dirInfo.extensionName,
        );
        for (const skill of skills) {
          registry.registerSkill(skill);
        }
      } catch (error) {
        // Directory might not exist, which is fine
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error(
            `[SkillLoader] Error loading skills from ${dirInfo.path}:`,
            error,
          );
        }
      }
    }
  }

  /**
   * Discovers all skill folders in a directory.
   * Each subfolder containing a SKILL.md file is considered a skill.
   */
  private async discoverSkillsInDirectory(
    dirPath: string,
    extensionName?: string,
  ): Promise<DiscoveredSkill[]> {
    const skills: DiscoveredSkill[] = [];

    let entries: Dirent[];
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return skills;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const skillDir = path.join(dirPath, entry.name);
      const skillFilePath = path.join(skillDir, SKILL_FILE_NAME);

      try {
        const skill = await this.loadSkillFromFile(
          skillFilePath,
          skillDir,
          extensionName,
        );
        if (skill) {
          skills.push(skill);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error(
            `[SkillLoader] Error loading skill from ${skillFilePath}:`,
            error,
          );
        }
      }
    }

    return skills;
  }

  /**
   * Loads a single skill from a SKILL.md file.
   * Parses YAML frontmatter and extracts skill metadata.
   */
  private async loadSkillFromFile(
    filePath: string,
    skillDir: string,
    extensionName?: string,
  ): Promise<DiscoveredSkill | null> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed = this.parseFrontmatter(fileContent);

    if (!parsed) {
      console.warn(
        `[SkillLoader] Skipping ${filePath}: Invalid or missing YAML frontmatter.`,
      );
      return null;
    }

    const { frontmatter, content } = parsed;

    // Validate required fields
    if (!frontmatter.name || typeof frontmatter.name !== 'string') {
      console.warn(
        `[SkillLoader] Skipping ${filePath}: Missing required 'name' field in frontmatter.`,
      );
      return null;
    }

    if (
      !frontmatter.description ||
      typeof frontmatter.description !== 'string'
    ) {
      console.warn(
        `[SkillLoader] Skipping ${filePath}: Missing required 'description' field in frontmatter.`,
      );
      return null;
    }

    // Truncate description if too long
    let description = frontmatter.description;
    if (description.length > 1024) {
      console.warn(
        `[SkillLoader] Warning: Skill "${frontmatter.name}" has description longer than 1024 chars. Truncating.`,
      );
      description = description.substring(0, 1021) + '...';
    }

    return {
      name: frontmatter.name,
      description,
      content,
      path: skillDir,
      extensionName,
      tags: frontmatter.tags,
      examples: frontmatter.examples,
      inputModes: frontmatter.inputModes,
      outputModes: frontmatter.outputModes,
    };
  }

  /**
   * Parses YAML frontmatter from a markdown file.
   * Returns null if the file doesn't have valid frontmatter.
   */
  private parseFrontmatter(
    content: string,
  ): { frontmatter: SkillFrontmatter; content: string } | null {
    const match = content.match(FRONTMATTER_REGEX);
    if (!match) {
      return null;
    }

    try {
      const frontmatter = yaml.parse(match[1]) as SkillFrontmatter;
      return {
        frontmatter,
        content: match[2].trim(),
      };
    } catch {
      return null;
    }
  }
}

/**
 * Gets the user skills directory path.
 */
export function getUserSkillsDir(): string {
  const homeDir = os.homedir();
  if (!homeDir) {
    return path.join(os.tmpdir(), '.gemini', 'skills');
  }
  return path.join(homeDir, '.gemini', 'skills');
}

/**
 * Gets the project skills directory path for a given project root.
 */
export function getProjectSkillsDir(projectRoot: string): string {
  return path.join(projectRoot, '.gemini', 'skills');
}
