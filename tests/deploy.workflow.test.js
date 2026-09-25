const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('Orbit-0018: GitHub Actions Frontend Deployment Workflow (.github/workflows/deploy.yml)', async (t) => {
  const workflowPath = path.resolve(__dirname, '../.github/workflows/deploy.yml');

  await t.test('Workflow file exists in .github/workflows/deploy.yml', () => {
    assert.strictEqual(fs.existsSync(workflowPath), true, 'El archivo deploy.yml debe existir');
  });

  const content = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : '';

  await t.test('Workflow triggers on push to main and manual dispatch (workflow_dispatch)', () => {
    assert.match(content, /branches:\s*(\[\s*main\s*\]|- main)/, 'Debe ejecutarse en push a main');
    assert.match(content, /workflow_dispatch:/, 'Debe soportar disparo manual vía workflow_dispatch');
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

  await t.test('Synchronizes compiled browser assets to S3 with --delete flag', () => {
    assert.match(content, /aws s3 sync dist\/orbit-frontend\/browser\//, 'Debe sincronizar dist/orbit-frontend/browser/');
    assert.match(content, /--delete/, 'Debe incluir el flag --delete para limpiar assets obsoletos');
  });

  await t.test('Invalidates CloudFront distribution cache for /* paths', () => {
    assert.match(content, /aws cloudfront create-invalidation/, 'Debe ejecutar invalidación de CloudFront');
    assert.match(content, /--paths\s+["']?\/\*["']?/, 'Debe invalidar la ruta /*');
  });

  await t.test('Defines concurrency group to prevent overlapping production deployments', () => {
    assert.match(content, /concurrency:/, 'Debe definir bloque de concurrencia');
    assert.match(content, /cancel-in-progress:\s*false/, 'No debe cancelar deploys en progreso de producción');
  });
});
