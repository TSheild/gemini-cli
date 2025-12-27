/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a discovered agent skill.
 * Skills are folders containing a SKILL.md file with instructions
 * that teach the agent how to perform specific tasks.
 */
export interface DiscoveredSkill {
  /** Unique identifier for the skill (from YAML frontmatter) */
  name: string;
  /** Human-readable description of what the skill does (from YAML frontmatter) */
  description: string;
  /** The full content of the SKILL.md file (loaded on-demand) */
  content: string;
  /** The directory path where the skill is located */
  path: string;
  /** Optional extension name if the skill came from an extension */
  extensionName?: string;
  /** Optional tags for categorization */
  tags?: string[];
  /** Optional list of example prompts that would trigger this skill */
  examples?: string[];
  /** Input modes supported by the skill */
  inputModes?: string[];
  /** Output modes supported by the skill */
  outputModes?: string[];
}

/**
 * YAML frontmatter schema for SKILL.md files.
 * Required fields: name, description
 */
export interface SkillFrontmatter {
  /** Unique identifier for the skill */
  name: string;
  /** Description of what the skill does and when to use it (max 1024 chars) */
  description: string;
  /** Optional tags for categorization */
  tags?: string[];
  /** Optional example prompts */
  examples?: string[];
  /** Optional input modes */
  inputModes?: string[];
  /** Optional output modes */
  outputModes?: string[];
}

/**
 * Configuration for skills in settings.json
 */
export interface SkillsSettings {
  /** List of skill names that are explicitly enabled */
  enabled?: string[];
  /** List of skill names that are explicitly disabled */
  disabled?: string[];
  /** Per-skill configuration overrides */
  configuration?: Record<string, Record<string, unknown>>;
}
