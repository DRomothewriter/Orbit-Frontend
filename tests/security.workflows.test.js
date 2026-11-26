const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const yaml = require('js-yaml');

const rootDir = path.resolve(__dirname, '..');

function readText(relPath) {
  const fullPath = path.join(rootDir, relPath);
  assert.equal(fs.existsSync(fullPath), true, `Expected file to exist: ${relPath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

function readYaml(relPath) {
  const raw = readText(relPath);
  const parsed = yaml.load(raw);
  assert.ok(parsed && typeof parsed === 'object', `Expected valid YAML object in ${relPath}`);
  return { raw, parsed };
}

function readJson(relPath) {
  const raw = readText(relPath);
  return JSON.parse(raw);
}

function collectJobScripts(job) {
  return (job?.steps ?? [])
    .map((s) => s.run ?? '')
    .filter(Boolean)
    .join('\n');
}

function normalizeWs(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function findJobBy(workflow, predicate) {
  return Object.entries(workflow.jobs ?? {}).find(([id, job]) => predicate(id, job));
}

function allJobs(workflow) {
  return Object.entries(workflow.jobs ?? {});
}

test('Legacy workflows deploy.yml and validate-pr-source.yml MUST NOT exist', () => {
  for (const relPath of [
    '.github/workflows/deploy.yml',
    '.github/workflows/validate-pr-source.yml',
  ]) {
    const fullPath = path.join(rootDir, relPath);
    assert.equal(fs.existsSync(fullPath), false, `Legacy workflow must be removed: ${relPath}`);
  }
});

test('Workflow 1: CI Dev (.github/workflows/ci-dev.yml)', async (t) => {
  const workflowRelPath = '.github/workflows/ci-dev.yml';

  await t.test('Triggers on pull_request to dev and enforces minimal permissions', () => {
    const { raw, parsed } = readYaml(workflowRelPath);

    assert.ok(
      Array.isArray(parsed.on?.pull_request?.branches) &&
        parsed.on.pull_request.branches.includes('dev'),
      'ci-dev.yml must trigger on pull_request targeting dev'
    );
    assert.doesNotMatch(raw, /permissions:\s*write-all/i);

    const allowedPermissions = new Map([
      ['contents', 'read'],
      ['pull-requests', 'read'],
      ['security-events', 'write'],
    ]);

    for (const [perm, level] of Object.entries(parsed.permissions ?? {})) {
      assert.equal(
        allowedPermissions.get(perm),
        level,
        `ci-dev.yml workflow permission "${perm}: ${level}" is not allowed`
      );
    }

    for (const [jobId, job] of allJobs(parsed)) {
      const effective = job.permissions ?? parsed.permissions ?? {};
      assert.equal(effective['id-token'], undefined, `ci-dev.yml job "${jobId}" must not request id-token`);
      assert.equal(effective.contents, 'read', `ci-dev.yml job "${jobId}" must have contents: read`);
      for (const [perm, level] of Object.entries(effective)) {
        assert.equal(
          allowedPermissions.get(perm),
          level,
          `ci-dev.yml job "${jobId}" permission "${perm}: ${level}" is not allowed`
        );
      }
    }

    const scaPerms = parsed.jobs?.['sca-audit']?.permissions ?? parsed.permissions ?? {};
    assert.equal(scaPerms['pull-requests'], 'read');
    assert.equal(scaPerms['security-events'], 'write');
  });

  await t.test('Blocks main -> dev, validates branch prefixes, runs npm ci, build, and lint:security', () => {
    const { parsed } = readYaml(workflowRelPath);
    const allScripts = allJobs(parsed)
      .map(([, job]) => collectJobScripts(job))
      .join('\n');
    const serialized = JSON.stringify(parsed);

    assert.match(serialized, /head_ref/);
    assert.match(allScripts, /\bmain\b/);
    for (const prefix of ['feature/', 'bug/', 'fix/', 'docs/', 'chore/', 'refactor/', 'test/']) {
      assert.ok(allScripts.includes(prefix), `Branch prefix check must include ${prefix}`);
    }
    assert.match(allScripts, /npm ci/);
    assert.match(allScripts, /npm run build/);
    assert.match(allScripts, /npm run lint:security/);
  });

  await t.test('Runs TruffleHog secret scanning (trufflesecurity/trufflehog@main) with --only-verified', () => {
    const { parsed } = readYaml(workflowRelPath);
    const allSteps = allJobs(parsed).flatMap(([, j]) => j.steps ?? []);
    const truffleStep = allSteps.find((s) =>
      String(s.uses ?? '').startsWith('trufflesecurity/trufflehog@main')
    );
    assert.ok(truffleStep, 'Expected trufflesecurity/trufflehog@main step');

    const extraArgs = String(truffleStep.with?.extra_args ?? '');
    assert.ok(extraArgs.includes('--only-verified'), 'TruffleHog must pass --only-verified');
    assert.doesNotMatch(extraArgs, /--results=/);
  });

  await t.test('Runs SCA: dependency-review-action@v4, npm audit, Snyk Open Source (gated for dependabot[bot]), SARIF upload, and 14-day artifact', () => {
    const { parsed } = readYaml(workflowRelPath);
    const allSteps = allJobs(parsed).flatMap(([, j]) => j.steps ?? []);
    const allScripts = normalizeWs(
      allJobs(parsed)
        .map(([, j]) => collectJobScripts(j))
        .join('\n')
    );
    const serialized = JSON.stringify(parsed);

    const depReviewStep = allSteps.find((s) =>
      String(s.uses ?? '').startsWith('actions/dependency-review-action@v4')
    );
    assert.ok(depReviewStep, 'Expected actions/dependency-review-action@v4');
    assert.equal(depReviewStep.with?.['fail-on-severity'], 'high');
    assert.equal(depReviewStep.if, undefined);

    const npmAuditStep = allSteps.find((s) => (s.run ?? '').includes('npm audit'));
    assert.ok(npmAuditStep, 'Expected npm audit step');
    assert.match(allScripts, /npm audit --omit=dev --audit-level=high/);
    assert.equal(npmAuditStep.if, undefined);

    const snykStep = allSteps.find((s) => String(s.uses ?? '').startsWith('snyk/actions/node'));
    assert.ok(snykStep, 'Expected snyk/actions/node step');
    assert.ok(String(snykStep.with?.args ?? '').includes('--severity-threshold=high'));
    assert.ok(String(snykStep.with?.args ?? '').includes('.sarif'));
    assert.notEqual(snykStep['continue-on-error'], true);
    assert.match(
      String(snykStep.if ?? ''),
      /steps\.snyk-gate\.outputs\.run_snyk\s*==\s*'true'/,
      "Snyk step must gate on steps.snyk-gate.outputs.run_snyk == 'true'"
    );
    assert.doesNotMatch(String(snykStep.if ?? ''), /run_snyk\s*==\s*'false'/);
    assert.ok(serialized.includes('dependabot[bot]'));
    assert.ok(serialized.includes('SNYK_TOKEN'));

    const snykGateStep = allSteps.find((s) => s.id === 'snyk-gate');
    assert.ok(snykGateStep, 'Expected snyk-gate step');
    const runSnykGate = (actor, hasToken) => {
      const outFile = path.join(
        require('node:os').tmpdir(),
        `snyk-gate-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.out`
      );
      try {
        const res = spawnSync('bash', ['-c', snykGateStep.run], {
          env: {
            PATH: process.env.PATH,
            ACTOR: actor,
            HAS_TOKEN: String(hasToken),
            GITHUB_OUTPUT: outFile,
          },
          encoding: 'utf8',
        });
        assert.equal(res.status, 0, `snyk-gate failed: ${res.stderr}`);
        return fs.readFileSync(outFile, 'utf8').trim();
      } finally {
        if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
      }
    };
    assert.equal(runSnykGate('developer', 'true'), 'run_snyk=true');
    assert.equal(runSnykGate('developer', 'false'), 'run_snyk=true');
    assert.equal(runSnykGate('dependabot[bot]', 'true'), 'run_snyk=true');
    assert.equal(runSnykGate('dependabot[bot]', 'false'), 'run_snyk=false');

    const sarifStep = allSteps.find((s) =>
      String(s.uses ?? '').startsWith('github/codeql-action/upload-sarif@v3')
    );
    assert.ok(sarifStep, 'Expected github/codeql-action/upload-sarif@v3 step');
    assert.match(String(sarifStep.if ?? ''), /\balways\(\)/);
    assert.doesNotMatch(String(sarifStep.if ?? ''), /\bsuccess\(\)/);

    const uploadStep = allSteps.find(
      (s) =>
        String(s.uses ?? '').startsWith('actions/upload-artifact@v4') &&
        s.with?.name === 'dev-sca-secrets-reports'
    );
    assert.ok(uploadStep, 'Expected dev-sca-secrets-reports artifact upload');
    assert.match(String(uploadStep.if ?? ''), /\balways\(\)/);
    assert.doesNotMatch(String(uploadStep.if ?? ''), /\bsuccess\(\)/);
    assert.equal(uploadStep.with?.['retention-days'], 14);
  });
});

test('Workflow 2: Security Main (.github/workflows/security-main.yml)', async (t) => {
  const workflowRelPath = '.github/workflows/security-main.yml';

  await t.test('Triggers on pull_request to main, push to main, workflow_dispatch, and does NOT auto-deploy to S3/CloudFront', () => {
    const { raw, parsed } = readYaml(workflowRelPath);

    assert.ok(parsed.on?.pull_request?.branches?.includes('main'));
    assert.ok(parsed.on?.push?.branches?.includes('main'));
    assert.notEqual(parsed.on?.workflow_dispatch, undefined);

    assert.doesNotMatch(raw, /aws s3 sync/i);
    assert.doesNotMatch(raw, /aws cloudfront create-invalidation/i);
    assert.doesNotMatch(raw, /deploy-production/);
  });

  await t.test('Verifies PR originates from dev', () => {
    const { parsed } = readYaml(workflowRelPath);
    const prEntry = findJobBy(parsed, (_id, job) =>
      JSON.stringify(job).includes('head_ref') && String(job.if ?? '').includes('pull_request')
    );
    assert.ok(prEntry, 'Expected a job verifying PR originates from dev');

    const [, job] = prEntry;
    const rejectStep = (job.steps ?? []).find((s) =>
      /github\.head_ref\s*!=\s*['"]dev['"]/.test(String(s.if ?? ''))
    );
    assert.ok(rejectStep, "verify-source-branch must reject github.head_ref != 'dev' (exact 'dev')");
    assert.match(String(rejectStep.run ?? ''), /exit\s+1/);
  });

  await t.test('Runs Angular headless unit tests with coverage and node --test tests/*.test.js, uploading test-coverage-lcov (14 days)', () => {
    const { parsed } = readYaml(workflowRelPath);
    const unitEntry = findJobBy(parsed, (_id, job) => {
      const scripts = normalizeWs(collectJobScripts(job));
      return scripts.includes('ng test') && scripts.includes('--code-coverage');
    });
    assert.ok(unitEntry, 'Expected Unit Tests & Coverage job');

    const [, job] = unitEntry;
    const scripts = normalizeWs(collectJobScripts(job));
    assert.match(scripts, /ng test\b[^&\n]*--watch=false/);
    assert.match(scripts, /--browsers=ChromeHeadless/);
    assert.match(scripts, /--code-coverage/);
    assert.match(scripts, /node --test tests\/\*\.test\.js/);

    const uploadStep = (job.steps ?? []).find(
      (s) =>
        String(s.uses ?? '').startsWith('actions/upload-artifact@v4') &&
        s.with?.name === 'test-coverage-lcov'
    );
    assert.ok(uploadStep, 'Expected test-coverage-lcov artifact upload');
    assert.equal(uploadStep.with?.['retention-days'], 14);
  });

  await t.test('Runs SonarCloud Quality Gate depending on unit tests with qualitygate.wait=true, vars.SONAR_ORGANIZATION, vars.SONAR_PROJECT_KEY', () => {
    const { parsed } = readYaml(workflowRelPath);
    const unitEntry = findJobBy(parsed, (_id, job) =>
      normalizeWs(collectJobScripts(job)).includes('--code-coverage')
    );
    const sonarEntry = findJobBy(parsed, (_id, job) =>
      (job.steps ?? []).some((s) =>
        String(s.uses ?? '').startsWith('SonarSource/sonarqube-scan-action')
      )
    );
    assert.ok(unitEntry, 'Expected unit test job');
    assert.ok(sonarEntry, 'Expected SonarCloud job');

    const [unitJobId] = unitEntry;
    const [, sonarJob] = sonarEntry;
    const needs = Array.isArray(sonarJob.needs) ? sonarJob.needs : [sonarJob.needs];
    assert.ok(needs.includes(unitJobId), 'SonarCloud job must depend on unit tests job');

    const downloadStep = (sonarJob.steps ?? []).find(
      (s) =>
        String(s.uses ?? '').startsWith('actions/download-artifact') &&
        s.with?.name === 'test-coverage-lcov'
    );
    assert.ok(downloadStep, 'SonarCloud job must download test-coverage-lcov');

    const serialized = JSON.stringify(sonarJob);
    assert.ok(serialized.includes('sonar.qualitygate.wait=true'));
    assert.ok(serialized.includes('vars.SONAR_ORGANIZATION'));
    assert.ok(serialized.includes('vars.SONAR_PROJECT_KEY'));
    assert.ok(serialized.includes('SONAR_TOKEN'));
  });

  await t.test('Runs CodeQL (javascript-typescript, security-extended)', () => {
    const { parsed } = readYaml(workflowRelPath);
    const allSteps = allJobs(parsed).flatMap(([, j]) => j.steps ?? []);

    const initStep = allSteps.find((s) =>
      String(s.uses ?? '').startsWith('github/codeql-action/init@v3')
    );
    assert.ok(initStep, 'Expected github/codeql-action/init@v3');
    assert.ok(String(initStep.with?.languages ?? '').includes('javascript-typescript'));
    assert.ok(String(initStep.with?.queries ?? '').includes('security-extended'));

    const analyzeStep = allSteps.find((s) =>
      String(s.uses ?? '').startsWith('github/codeql-action/analyze@v3')
    );
    assert.ok(analyzeStep, 'Expected github/codeql-action/analyze@v3');
  });

  await t.test('Runs Snyk Code (--severity-threshold=high, SARIF, artifact sast-snyk-reports 30 days)', () => {
    const { parsed } = readYaml(workflowRelPath);
    const snykEntry = findJobBy(parsed, (_id, job) =>
      JSON.stringify(job).includes('snyk code test')
    );
    assert.ok(snykEntry, 'Expected Snyk Code job');

    const [, job] = snykEntry;
    const serialized = JSON.stringify(job);
    assert.ok(serialized.includes('--severity-threshold=high'));
    assert.ok(serialized.includes('.sarif'));

    const sarifStep = (job.steps ?? []).find((s) =>
      String(s.uses ?? '').startsWith('github/codeql-action/upload-sarif@v3')
    );
    assert.ok(sarifStep, 'Expected SARIF upload in Snyk Code job');
    assert.match(String(sarifStep.if ?? ''), /\balways\(\)/);
    assert.doesNotMatch(String(sarifStep.if ?? ''), /\bsuccess\(\)/);

    const uploadStep = (job.steps ?? []).find(
      (s) =>
        String(s.uses ?? '').startsWith('actions/upload-artifact@v4') &&
        s.with?.name === 'sast-snyk-reports'
    );
    assert.ok(uploadStep, 'Expected sast-snyk-reports artifact upload');
    assert.match(String(uploadStep.if ?? ''), /\balways\(\)/);
    assert.doesNotMatch(String(uploadStep.if ?? ''), /\bsuccess\(\)/);
    assert.equal(uploadStep.with?.['retention-days'], 30);
  });

  await t.test('Runs Syft (cyclonedx-json, spdx-json) + Grype (fail-build: true, severity-cutoff: high, only-fixed: true, artifact sbom-and-grype-reports 30 days)', () => {
    const { parsed } = readYaml(workflowRelPath);
    const sbomEntry = findJobBy(parsed, (_id, job) =>
      (job.steps ?? []).some((s) => String(s.uses ?? '').startsWith('anchore/sbom-action'))
    );
    assert.ok(sbomEntry, 'Expected Syft + Grype job');

    const [, job] = sbomEntry;
    assert.notEqual(
      job['continue-on-error'],
      true,
      'Grype job in security-main.yml must not set continue-on-error: true'
    );
    const steps = job.steps ?? [];
    const formats = steps
      .filter((s) => String(s.uses ?? '').startsWith('anchore/sbom-action'))
      .map((s) => s.with?.format);
    assert.ok(formats.includes('cyclonedx-json'), 'Must generate cyclonedx-json SBOM');
    assert.ok(formats.includes('spdx-json'), 'Must generate spdx-json SBOM');

    const grypeSteps = steps.filter((s) => String(s.uses ?? '').startsWith('anchore/scan-action'));
    assert.ok(grypeSteps.length > 0, 'Expected anchore/scan-action (Grype)');
    for (const gStep of grypeSteps) {
      assert.notEqual(
        gStep['continue-on-error'],
        true,
        'Grype step in security-main.yml must not set continue-on-error: true'
      );
    }
    const grypeStep = grypeSteps[0];
    assert.equal(grypeStep.with?.['fail-build'], true);
    assert.equal(grypeStep.with?.['severity-cutoff'], 'high');
    assert.equal(grypeStep.with?.['only-fixed'], true);

    const grypeSarifStep = steps.find((s) =>
      String(s.uses ?? '').startsWith('github/codeql-action/upload-sarif@v3')
    );
    assert.ok(grypeSarifStep, 'Expected SARIF upload in Syft + Grype job');
    assert.match(String(grypeSarifStep.if ?? ''), /\balways\(\)/);
    assert.doesNotMatch(String(grypeSarifStep.if ?? ''), /\bsuccess\(\)/);

    const uploadStep = steps.find(
      (s) =>
        String(s.uses ?? '').startsWith('actions/upload-artifact@v4') &&
        s.with?.name === 'sbom-and-grype-reports'
    );
    assert.ok(uploadStep, 'Expected sbom-and-grype-reports artifact upload');
    assert.match(String(uploadStep.if ?? ''), /\balways\(\)/);
    assert.doesNotMatch(String(uploadStep.if ?? ''), /\bsuccess\(\)/);
    assert.equal(uploadStep.with?.['retention-days'], 30);
  });

  await t.test('Runs OWASP ZAP Baseline (-j Ajax Spider, .zap/rules.tsv, port 4200, dist/orbit-frontend/browser, XML/HTML/MD reports, 30 days always(), fail closed except 0 and 2)', () => {
    const { parsed } = readYaml(workflowRelPath);
    const zapEntry = findJobBy(parsed, (_id, job) =>
      JSON.stringify(job).includes('zap-baseline.py')
    );
    assert.ok(zapEntry, 'Expected OWASP ZAP Baseline job');

    const [, job] = zapEntry;
    const steps = job.steps ?? [];
    const scripts = normalizeWs(collectJobScripts(job));
    const serialized = JSON.stringify(job);

    assert.ok(serialized.includes('zap-baseline.py'));
    assert.match(scripts, /\s-j(\s|$)/, 'ZAP baseline must enable Ajax Spider (-j)');
    assert.ok(serialized.includes('.zap/rules.tsv'));
    assert.ok(serialized.includes('4200'));
    assert.ok(serialized.includes('dist/orbit-frontend/browser'));
    assert.ok(serialized.includes('zap-report.xml'));
    assert.ok(serialized.includes('zap-report.html'));
    assert.ok(serialized.includes('zap-report.md'));

    for (const step of steps) {
      assert.doesNotMatch(step.run ?? '', /\$\{\{\s*github\.workspace\s*\}\}/);
    }

    const zapStep = steps.find((s) => (s.run ?? '').includes('zap-baseline.py'));
    assert.ok(zapStep, 'Expected zap-baseline.py step');
    const envValues = Object.values(zapStep.env ?? {}).map((v) => String(v));
    assert.ok(
      envValues.some((v) => /\$\{\{\s*github\.workspace\s*\}\}/.test(v)),
      'ZAP step must bind github.workspace via env'
    );

    const zapRun = normalizeWs(zapStep.run ?? '');
    assert.match(zapRun, /-u\s+["']?\$\(id -u\):\$\(id -g\)["']?/);
    assert.match(zapRun, /(?:-e|--env)\s+["']?HOME=(\/tmp|\/zap\/wrk)["']?(?:\s|\\|$)/);

    const sanitizedRun = (zapStep.run ?? '').replace(/\$\{\{[^}]+\}\}/g, '/tmp/mock-workspace');
    const runWithMockExit = (mockExit) => {
      const envVars = {
        PATH: process.env.PATH,
        MOCK_ZAP_EXIT: String(mockExit),
      };
      for (const [key, val] of Object.entries(zapStep.env ?? {})) {
        envVars[key] = String(val).includes('github.workspace') ? '/tmp/mock-workspace' : 'stub';
      }
      const harness = ['set -e', 'docker() { return "$MOCK_ZAP_EXIT"; }', sanitizedRun].join('\n');
      return spawnSync('bash', ['-c', harness], { env: envVars, encoding: 'utf8' });
    };

    assert.equal(runWithMockExit(0).status, 0);
    const warnRes = runWithMockExit(2);
    assert.equal(warnRes.status, 0);
    assert.ok((warnRes.stdout + warnRes.stderr).includes('::warning::'));

    for (const failCode of [1, 3, 4, 125, 126, 127, 137]) {
      const failRes = runWithMockExit(failCode);
      assert.equal(failRes.status, failCode, `Exit code ${failCode} must fail`);
      assert.ok((failRes.stdout + failRes.stderr).includes('::error::'));
    }

    const uploadStep = steps.find(
      (s) =>
        String(s.uses ?? '').startsWith('actions/upload-artifact@v4') &&
        s.with?.name === 'dast-owasp-zap-xml'
    );
    assert.ok(uploadStep, 'Expected dast-owasp-zap-xml artifact upload');
    assert.match(String(uploadStep.if ?? ''), /\balways\(\)/);
    assert.doesNotMatch(String(uploadStep.if ?? ''), /\bsuccess\(\)/);
    assert.equal(uploadStep.with?.['retention-days'], 30);
  });
});

test('Workflow 3: Release & Production Deploy (.github/workflows/release.yml)', async (t) => {
  const workflowRelPath = '.github/workflows/release.yml';

  await t.test('Triggers on release published and workflow_dispatch without push trigger', () => {
    const { parsed } = readYaml(workflowRelPath);

    assert.equal(parsed.on?.push, undefined);
    assert.ok(parsed.on?.release?.types?.includes('published'));
    assert.notEqual(parsed.on?.workflow_dispatch, undefined);
  });

  await t.test('Validates origin/main ancestor (fetch-depth: 0) and SemVer vX.Y.Z, builds Angular production, and packages orbit-frontend-*.tar.gz', () => {
    const { parsed } = readYaml(workflowRelPath);
    const buildEntry = findJobBy(parsed, (id) => id !== 'deploy-production');
    assert.ok(buildEntry, 'Expected build/sign/attest job');

    const [, buildJob] = buildEntry;
    const steps = buildJob.steps ?? [];
    const scripts = normalizeWs(collectJobScripts(buildJob));

    const checkoutStep = steps.find((s) =>
      String(s.uses ?? '').startsWith('actions/checkout@v4')
    );
    assert.equal(checkoutStep?.with?.['fetch-depth'], 0);

    assert.match(scripts, /git\s+merge-base\s+--is-ancestor/);
    assert.match(scripts, /origin\/main/);
    assert.doesNotMatch(scripts, /git\s+fetch[^\n]*--depth(?:=|\s+)1\b/);
    assert.match(scripts, /\^v\[0-9\]\+/);
    assert.match(scripts, /npm ci/);
    assert.match(scripts, /(npm run build|ng build)/);
    assert.match(scripts, /orbit-frontend-/);
    assert.match(scripts, /\.tar\.gz/);
  });

  await t.test('Generates Syft SBOM + Grype (only-fixed: true, high), signs & verifies with Cosign Keyless, creates attestations, SHA256SUMS.txt, 90-day artifact & gh release upload', () => {
    const { parsed } = readYaml(workflowRelPath);
    const buildEntry = findJobBy(parsed, (id) => id !== 'deploy-production');
    assert.ok(buildEntry);

    const [, buildJob] = buildEntry;
    assert.notEqual(
      buildJob['continue-on-error'],
      true,
      'Build/Grype job in release.yml must not set continue-on-error: true'
    );
    const steps = buildJob.steps ?? [];
    const scripts = normalizeWs(collectJobScripts(buildJob));

    assert.ok(steps.some((s) => String(s.uses ?? '').startsWith('anchore/sbom-action')));

    const grypeStep = steps.find((s) => String(s.uses ?? '').startsWith('anchore/scan-action'));
    assert.ok(grypeStep, 'Expected Grype scan in release.yml');
    assert.notEqual(
      grypeStep['continue-on-error'],
      true,
      'Grype step in release.yml must not set continue-on-error: true'
    );
    assert.equal(grypeStep.with?.['only-fixed'], true);
    assert.equal(grypeStep.with?.['severity-cutoff'], 'high');
    assert.equal(grypeStep.with?.['fail-build'], true);

    assert.ok(steps.some((s) => String(s.uses ?? '').startsWith('sigstore/cosign-installer')));
    assert.match(scripts, /cosign\s+sign-blob\b/);
    assert.match(scripts, /cosign\s+verify-blob\b/);
    assert.match(
      scripts,
      /--certificate-oidc-issuer[=\s]+["']?https:\/\/token\.actions\.githubusercontent\.com/
    );

    assert.ok(steps.some((s) => String(s.uses ?? '').startsWith('actions/attest-build-provenance')));
    assert.ok(steps.some((s) => String(s.uses ?? '').startsWith('actions/attest-sbom')));
    assert.ok(scripts.includes('SHA256SUMS.txt'));
    assert.match(scripts, /gh\s+release\s+upload/);

    const uploadStep = steps.find(
      (s) =>
        String(s.uses ?? '').startsWith('actions/upload-artifact@v4') &&
        s.with?.['retention-days'] === 90
    );
    assert.ok(uploadStep, 'Expected 90-day release artifact upload');
  });

  await t.test('deploy-production uses environment: production, re-verifies signature/checksum, and deploys to S3 + CloudFront via OIDC', () => {
    const { parsed } = readYaml(workflowRelPath);
    const deployJob = parsed.jobs?.['deploy-production'];
    assert.ok(deployJob, 'Expected deploy-production job');

    const envName =
      typeof deployJob.environment === 'string'
        ? deployJob.environment
        : deployJob.environment?.name;
    assert.equal(envName, 'production');

    const steps = deployJob.steps ?? [];
    const scripts = normalizeWs(collectJobScripts(deployJob));
    const serialized = JSON.stringify(deployJob);

    assert.match(scripts, /cosign\s+verify-blob\b/);
    assert.match(scripts, /sha256sum/);

    const awsCredsStep = steps.find((s) =>
      String(s.uses ?? '').startsWith('aws-actions/configure-aws-credentials@v4')
    );
    assert.ok(awsCredsStep, 'Expected aws-actions/configure-aws-credentials@v4');
    assert.ok(serialized.includes('AWS_ROLE_ARN'));
    assert.ok(serialized.includes('S3_FRONTEND_BUCKET_NAME'));
    assert.ok(serialized.includes('CLOUDFRONT_DISTRIBUTION_ID'));
    assert.match(scripts, /aws\s+s3\s+sync/);
    assert.match(scripts, /aws\s+cloudfront\s+create-invalidation/);
  });
});

test('R3/R4 Security Configs, GitHub Policy Enforcement & Angular Hardening', async (t) => {
  await t.test('.coderabbit.yaml configures es-ES and auto-reviews dev and main', () => {
    const { parsed } = readYaml('.coderabbit.yaml');
    assert.equal(parsed.language, 'es-ES');
    assert.ok(parsed.reviews?.auto_review?.base_branches?.includes('dev'));
    assert.ok(parsed.reviews?.auto_review?.base_branches?.includes('main'));
  });

  await t.test('sonar-project.properties configures sonar.sources=src and lcov report path', () => {
    const content = readText('sonar-project.properties');
    assert.match(content, /^sonar\.sources=src$/m);
    assert.match(content, /^sonar\.typescript\.lcov\.reportPaths=coverage\/lcov\.info$/m);
  });

  await t.test('.zap/rules.tsv exists, is non-empty, and defines tab-separated FAIL/WARN rules', () => {
    const content = readText('.zap/rules.tsv');
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    assert.ok(lines.length > 0);
    assert.ok(lines.every((l) => l.includes('\t')));
  });

  await t.test('.github/CODEOWNERS protects critical security, workflow, and build files', () => {
    const content = readText('.github/CODEOWNERS');
    const activeLines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    const requiredPatterns = [
      '/.github/',
      '/package*.json',
      '/angular.json',
      '/eslint.config.mjs',
      '/.zap/',
      '/.coderabbit.yaml',
      '/sonar-project.properties',
      '/scripts/',
    ];

    for (const pattern of requiredPatterns) {
      const matchingLine = activeLines.find((line) => {
        const tokens = line.split(/\s+/);
        return (
          tokens[0] === pattern &&
          tokens.slice(1).some((t) => /^@[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)?$/.test(t))
        );
      });
      assert.ok(
        matchingLine,
        `CODEOWNERS must protect ${pattern} in an active non-comment line with at least one @owner`
      );
    }
  });

  await t.test('.github/dependabot.yml configures version 2 for npm and github-actions targeting dev', () => {
    const { parsed } = readYaml('.github/dependabot.yml');
    assert.equal(parsed.version, 2);
    assert.ok(Array.isArray(parsed.updates));

    for (const eco of ['npm', 'github-actions']) {
      const entry = parsed.updates.find((u) => u['package-ecosystem'] === eco);
      assert.ok(entry, `Dependabot must configure ${eco}`);
      assert.equal(entry['target-branch'], 'dev');
    }
  });

  await t.test('.github/rulesets/*.json define valid active rulesets matching workflow job names', () => {
    const mainRuleset = readJson('.github/rulesets/main-ruleset.json');
    const devRuleset = readJson('.github/rulesets/dev-ruleset.json');
    const tagsRuleset = readJson('.github/rulesets/tags-ruleset.json');

    const { parsed: securityMain } = readYaml('.github/workflows/security-main.yml');
    const { parsed: ciDev } = readYaml('.github/workflows/ci-dev.yml');

    assert.equal(mainRuleset.target, 'branch');
    assert.equal(mainRuleset.enforcement, 'active');
    assert.ok(mainRuleset.conditions?.ref_name?.include?.includes('refs/heads/main'));
    const mainChecksRule = (mainRuleset.rules ?? []).find(
      (r) => r.type === 'required_status_checks'
    );
    assert.ok(mainChecksRule);
    const mainContexts = (mainChecksRule.parameters?.required_status_checks ?? []).map((c) =>
      typeof c === 'string' ? c : c.context
    );
    assert.ok(mainContexts.length > 0, 'main-ruleset required_status_checks must be non-empty');
    const securityMainJobNames = Object.values(securityMain.jobs ?? {}).map((j) => j.name);
    const expectedMainJobNames = [
      'Verify PR originates from dev',
      'Unit Tests & Coverage',
      'SAST - SonarCloud Quality Gate',
      'SAST - CodeQL (javascript-typescript)',
      'SAST - Snyk Code',
      'SBOM & SCA - Syft & Grype',
      'DAST - OWASP ZAP Baseline Scan',
    ];
    for (const expectedName of expectedMainJobNames) {
      assert.ok(
        mainContexts.includes(expectedName),
        `main-ruleset must require job "${expectedName}"`
      );
    }
    for (const ctx of mainContexts) {
      assert.ok(securityMainJobNames.includes(ctx), `main-ruleset context "${ctx}" must match security-main.yml job name`);
    }

    assert.equal(devRuleset.target, 'branch');
    assert.equal(devRuleset.enforcement, 'active');
    assert.ok(devRuleset.conditions?.ref_name?.include?.includes('refs/heads/dev'));
    const devChecksRule = (devRuleset.rules ?? []).find(
      (r) => r.type === 'required_status_checks'
    );
    assert.ok(devChecksRule);
    const devContexts = (devChecksRule.parameters?.required_status_checks ?? []).map((c) =>
      typeof c === 'string' ? c : c.context
    );
    assert.ok(devContexts.length > 0, 'dev-ruleset required_status_checks must be non-empty');
    const ciDevJobNames = Object.values(ciDev.jobs ?? {}).map((j) => j.name);
    const expectedDevJobNames = [
      'Validate Source Branch, Security Lint & Angular Build',
      'Secret Scanning (TruffleHog)',
      'SCA (npm audit, Dependency Review & Snyk)',
    ];
    for (const expectedName of expectedDevJobNames) {
      assert.ok(
        devContexts.includes(expectedName),
        `dev-ruleset must require job "${expectedName}"`
      );
    }
    for (const ctx of devContexts) {
      assert.ok(ciDevJobNames.includes(ctx), `dev-ruleset context "${ctx}" must match ci-dev.yml job name`);
    }

    assert.equal(tagsRuleset.target, 'tag');
    assert.equal(tagsRuleset.enforcement, 'active');
    assert.ok(tagsRuleset.conditions?.ref_name?.include?.includes('refs/tags/v*'));
  });

  await t.test('scripts/apply-github-policies.sh exists, is executable, and configures rulesets and production environment', () => {
    const scriptPath = path.join(rootDir, 'scripts/apply-github-policies.sh');
    const fd = fs.openSync(scriptPath, 'r');
    try {
      const stat = fs.fstatSync(fd);
      assert.notEqual(stat.mode & 0o111, 0, 'apply-github-policies.sh must be executable');

      const content = fs.readFileSync(fd, 'utf8');
      assert.match(content, /^#!\/(usr\/bin\/env bash|bin\/bash)/);
      assert.ok(content.includes('gh api'));
      assert.ok(content.includes('rulesets'));
      assert.ok(content.includes('environments/production'));
    } finally {
      fs.closeSync(fd);
    }
  });

  await t.test('angular.json enables subresourceIntegrity: true in production configuration', () => {
    const angularJson = readJson('angular.json');
    const projects = Object.values(angularJson.projects ?? {});
    assert.ok(projects.length > 0);
    for (const proj of projects) {
      const prodConfig = proj?.architect?.build?.configurations?.production;
      assert.ok(prodConfig, 'Expected build production configuration in angular.json');
      assert.equal(prodConfig.subresourceIntegrity, true);
    }
  });

  await t.test('package.json defines lint:security and audit:ci scripts', () => {
    const pkg = readJson('package.json');
    assert.ok(pkg.scripts?.['lint:security'], 'package.json must define lint:security');
    assert.ok(pkg.scripts?.['audit:ci'], 'package.json must define audit:ci');
  });

  await t.test('No GitHub Actions expression injection (${{ github.* }} or ${{ inputs.* }}) in any run: step', () => {
    for (const wfPath of [
      '.github/workflows/ci-dev.yml',
      '.github/workflows/security-main.yml',
      '.github/workflows/release.yml',
    ]) {
      const { parsed } = readYaml(wfPath);
      for (const [jobId, job] of allJobs(parsed)) {
        for (const step of job.steps ?? []) {
          if (typeof step.run === 'string') {
            assert.doesNotMatch(
              step.run,
              /\$\{\{\s*(github|inputs)\.[^}]*\}\}/,
              `${wfPath} job "${jobId}" step "${step.name ?? '(unnamed)'}" must not interpolate github.* or inputs.* directly in run:`
            );
          }
        }
      }
    }
  });
});
