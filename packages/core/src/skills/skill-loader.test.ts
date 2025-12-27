/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import { getUserSkillsDir, getProjectSkillsDir } from './skill-loader.js';

describe('getUserSkillsDir', () => {
  it('should return ~/.gemini/skills path', () => {
    const expected = path.join(os.homedir(), '.gemini', 'skills');
    expect(getUserSkillsDir()).toBe(expected);
  });
});

describe('getProjectSkillsDir', () => {
  it('should return project/.gemini/skills path', () => {
    const projectRoot = '/my/project';
    const expected = path.join(projectRoot, '.gemini', 'skills');
    expect(getProjectSkillsDir(projectRoot)).toBe(expected);
  });
});
