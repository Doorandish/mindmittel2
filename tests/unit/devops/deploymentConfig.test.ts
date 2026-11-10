import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Deployment Blueprint (render.yaml), Package Scripts & Git Hooks', () => {
  const rootDir = path.resolve(__dirname, '../../../');

  it('ensures package.json defines standard build, start, and test scripts for Render', () => {
    const pkgRaw = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgRaw) as {
      name: string;
      scripts: Record<string, string>;
    };

    expect(pkg.name).toBe('mindmittel2');
    expect(pkg.scripts.build).toBe('next build');
    expect(pkg.scripts.start).toBe('next start');
    expect(pkg.scripts.test).toBe('vitest run');
  });

  it('includes a valid render.yaml blueprint targeting mindmittel2 web service and /api/health', () => {
    const renderYamlPath = path.join(rootDir, 'render.yaml');
    expect(fs.existsSync(renderYamlPath)).toBe(true);

    const content = fs.readFileSync(renderYamlPath, 'utf-8');
    expect(content).toContain('name: mindmittel2');
    expect(content).toContain('buildCommand: npm install && npm run build');
    expect(content).toContain('startCommand: npm run start');
    expect(content).toContain('healthCheckPath: /api/health');
    expect(content).toContain('GEMINI_API_KEY');
    expect(content).toContain('MONGODB_URI');
    expect(content).toContain('mindmittel_v2');
  });

  it('configures Husky pre-commit test gate and GitHub Actions CI workflow', () => {
    const huskyPath = path.join(rootDir, '.husky/pre-commit');
    const ciPath = path.join(rootDir, '.github/workflows/ci.yml');

    expect(fs.existsSync(huskyPath)).toBe(true);
    expect(fs.existsSync(ciPath)).toBe(true);

    const huskyContent = fs.readFileSync(huskyPath, 'utf-8');
    expect(huskyContent).toContain('npm test');
  });

  it('defines a valid Heroku Procfile declaring web dyno startup command with dynamic $PORT binding', () => {
    const procfilePath = path.join(rootDir, 'Procfile');
    expect(fs.existsSync(procfilePath)).toBe(true);

    const procfileContent = fs.readFileSync(procfilePath, 'utf-8').trim();
    expect(procfileContent).toMatch(/^web:\s+npm\s+run\s+start\s+--\s+-p\s+\$PORT$/m);
  });
});
