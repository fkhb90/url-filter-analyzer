# Publishing

How to publish `url-filter-analyzer` to the npm registry.

The package is already publish-ready: `package.json` has `"files": ["dist"]`
(only the build output ships) and `"prepublishOnly": "npm run build"` (the build
runs automatically before publish).

## First release (manual)

```bash
# 1. Log in to npm (one time). Enable 2FA on your npm account first.
npm login
npm whoami            # confirm you are logged in

# 2. Preview exactly what will be published — does NOT upload.
npm publish --dry-run
#    The tarball should contain only dist/, README.md, LICENSE, package.json.

# 3. Publish.
npm publish --access public

# 4. Verify.
npm view url-filter-analyzer version
```

> npm does not allow re-publishing the same version. To release again, bump the
> `version` in `package.json` to a new number.

## Automated releases (CI)

`.github/workflows/release.yml` publishes automatically when a `v*` tag is
pushed — **if** an `NPM_TOKEN` repository secret is configured.

```bash
# 1. Create an "Automation" access token at https://www.npmjs.com/settings/~/tokens
#    (Automation tokens bypass 2FA, which CI needs.)

# 2. Add it as a repo secret:
gh secret set NPM_TOKEN --repo fkhb90/url-filter-analyzer

# 3. From then on, releasing is just:
#    - bump version in package.json
#    - update CHANGELOG.md
git commit -am "chore: release v0.1.1"
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin v0.1.1
#    CI then builds, tests, creates the GitHub Release, and publishes to npm.
```

## Notes

- The release workflow skips the publish step when `NPM_TOKEN` is not set, so
  tagging without the secret still creates a GitHub Release safely.
- Keep tokens secret — never commit them or paste them into shared tools.
