import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNextPath, safePortfolioImage, safePublicUrl, validateText, validateUsername } from '../lib/validation.mjs';

test('username rules normalize valid handles and reject unsafe/reserved values', () => {
  assert.equal(validateUsername('umar-dev'), null);
  assert.equal(validateUsername(' UMAR '), null);
  assert.match(validateUsername('../admin'), /Use 3/);
  assert.match(validateUsername('dashboard'), /reserved/);
  assert.match(validateUsername('ab'), /Use 3/);
});
test('post-auth redirects remain on this site', () => {
  assert.equal(safeNextPath('/dashboard/projects'), '/dashboard/projects');
  assert.equal(safeNextPath('//evil.example'), '/dashboard');
  assert.equal(safeNextPath('https://evil.example'), '/dashboard');
  assert.equal(safeNextPath('/\\evil.example'), '/dashboard');
});
test('public links require HTTPS', () => {
  assert.equal(safePublicUrl('https://github.com/umar'), true);
  assert.equal(safePublicUrl('javascript:alert(1)'), false);
  assert.equal(safePublicUrl('http://example.com'), false);
});
test('portfolio images are limited to same-origin uploaded asset paths', () => {
  assert.equal(safePortfolioImage('/media/10000000-0000-4000-8000-000000000001/avatar/a1b2.webp'), true);
  assert.equal(safePortfolioImage('https://example.com/image.png'), false);
  assert.equal(safePortfolioImage('/media/../secret.png'), false);
  assert.equal(safePortfolioImage('/media/10000000-0000-4000-8000-000000000001/avatar/x.svg'), false);
});
test('text fields reject empty and overlong content', () => {
  assert.match(validateText('  ', 40), /required/);
  assert.equal(validateText('Short bio', 40), null);
  assert.match(validateText('x'.repeat(41), 40), /40/);
});
