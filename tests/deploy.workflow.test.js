const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const rootDir = path.resolve(__dirname, '..');

test('Orbit Frontend Production Deployment Workflow (.github/workflows/release.yml)', async (t) => {
  const legacyDeployPath = path.join(rootDir, '.github/workflows/deploy.yml');
  const releasePath = path.join(rootDir, '.github/workflows/release.yml');

  await t.test('Legacy .github/workflows/deploy.yml no longer exists', () => {
    assert.equal(fs.existsSync(legacyDeployPath), false, 'deploy.yml debe haber sido eliminado');
  });

  await t.test('Workflow file exists in .github/workflows/release.yml and is valid YAML', () => {
    assert.equal(fs.existsSync(releasePath), true, 'El archivo release.yml debe existir');
    const parsed = yaml.load(fs.readFileSync(releasePath, 'utf8'));
    assert.ok(parsed && typeof parsed === 'object');
  });

  const content = fs.existsSync(releasePath) ? fs.readFileSync(releasePath, 'utf8') : '';
  const parsed = content ? yaml.load(content) : {};
  const deployJob = parsed?.jobs?.['deploy-production'];

  await t.test('Workflow triggers on release published and workflow_dispatch (no auto-deploy on push to main)', () => {
    assert.equal(parsed?.on?.push, undefined, 'No debe auto-desplegar en push a main');
    assert.ok(parsed?.on?.release?.types?.includes('published'), 'Debe ejecutarse en release published');
    assert.notEqual(parsed?.on?.workflow_dispatch, undefined, 'Debe soportar workflow_dispatch');
  });

  await t.test('deploy-production targets environment: production', () => {
    assert.ok(deployJob, 'Debe existir el job deploy-production');
    const envName =
      typeof deployJob.environment === 'string'
        ? deployJob.environment
        : deployJob.environment?.name;
    assert.equal(envName, 'production', 'deploy-production debe usar environment: production');
  });

  await t.test('Configures least-privilege OIDC permissions (id-token: write, contents: read)', () => {
    assert.match(content, /permissions:/, 'Debe declarar bloque de permisos');
    assert.match(content, /id-token:\s*write/, 'Debe otorgar permiso id-token: write para OIDC');
    assert.match(content, /contents:\s*read/, 'Debe otorgar permiso contents: read');
  });

  await t.test('Does NOT contain static AWS access keys or secrets', () => {
    assert.doesNotMatch(content, /AWS_ACCESS_KEY_ID/i, 'No debe usar AWS_ACCESS_KEY_ID');
    assert.doesNotMatch(content, /AWS_SECRET_ACCESS_KEY/i, 'No debe usar AWS_SECRET_ACCESS_KEY');
    assert.doesNotMatch(content, /aws-access-key-id/i, 'No debe configurar aws-access-key-id');
    assert.doesNotMatch(content, /aws-secret-access-key/i, 'No debe configurar aws-secret-access-key');
  });

  await t.test('Authenticates to AWS using aws-actions/configure-aws-credentials@v4 with OIDC role assumption', () => {
    assert.match(content, /uses:\s*aws-actions\/configure-aws-credentials@v4/, 'Debe usar configure-aws-credentials@v4');
    assert.match(content, /role-to-assume:/, 'Debe especificar role-to-assume para OIDC');
  });

  await t.test('Uses modern official GitHub actions (@v4)', () => {
    assert.match(content, /uses:\s*actions\/checkout@v4/, 'Debe usar actions/checkout@v4');
    assert.match(content, /uses:\s*actions\/setup-node@v4/, 'Debe usar actions/setup-node@v4');
  });

  await t.test('Installs dependencies with npm ci and builds Angular production application', () => {
    assert.match(content, /npm ci/, 'Debe instalar con npm ci');
    assert.match(content, /(npm run build|ng build)/, 'Debe compilar la app de Angular');
  });

  await t.test('Verifies Cosign signature before deploying to production', () => {
    const deployScripts = (deployJob?.steps ?? []).map((s) => s.run ?? '').join('\n');
    assert.match(deployScripts, /cosign\s+verify-blob\b/, 'deploy-production debe verificar firma con cosign verify-blob');
  });

  await t.test('Synchronizes compiled browser assets to S3 with --delete flag', () => {
    const deployScripts = (deployJob?.steps ?? []).map((s) => s.run ?? '').join('\n');
    assert.match(deployScripts, /aws\s+s3\s+sync/, 'Debe sincronizar assets a S3');
    assert.match(deployScripts, /--delete/, 'Debe incluir el flag --delete para limpiar assets obsoletos');
  });

  await t.test('Invalidates CloudFront distribution cache for /* paths', () => {
    const deployScripts = (deployJob?.steps ?? []).map((s) => s.run ?? '').join('\n');
    assert.match(deployScripts, /aws\s+cloudfront\s+create-invalidation/, 'Debe ejecutar invalidación de CloudFront');
    assert.match(deployScripts, /--paths\s+["']?\/\*["']?/, 'Debe invalidar la ruta /*');
  });

  await t.test('Defines concurrency group to prevent overlapping production deployments', () => {
    assert.match(content, /concurrency:/, 'Debe definir bloque de concurrencia');
    assert.match(content, /cancel-in-progress:\s*false/, 'No debe cancelar deploys en progreso de producción');
  });
});
