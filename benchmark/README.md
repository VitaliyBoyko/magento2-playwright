# Hyvä storefront benchmark

These tests run against a local Magento 2.4.8-p5 sample store with Hyvä CSP 1.5.3
and the Luma checkout fallback. MageLens supplies Playwright, fixture adapters,
coverage collection and reports. This checkout supplies test sources only;
its package manifest, lockfile and installation scripts are unchanged.

Edit `tests/` at the repository root for reusable suite improvements. Edit
`benchmark/tests/` for this store's configuration, specs, page objects and visual
baselines. Page-object overrides extend their upstream counterpart through
`@base/*`.

When this checkout is installed at `playwright/magento2-playwright/` inside the
configured MageLens benchmark, run from the MageLens root:

```sh
./bin/run-coverage
./bin/application-compose exec -T runner node bin/verify-benchmark.cjs
```

MageLens refreshes its execution copy before each run. Open
`coverage/index.html` in the MageLens directory for PHP, JavaScript and template
reports. Do not run this fork's npm installer for the MageLens benchmark.

The benchmark includes checkout, account, search, accessibility and visual
checks. Six reCAPTCHA cases use local rendered template fixtures and simulated
responses; they do not contact Google's service. They check checkbox, invisible
and v3 success and failure behavior.

Visual baselines in `benchmark/tests/baselines/chromium/` require the configured
sample data: Dash Digital Watch costs $93 and Impulse Duffle costs $73, avoiding
ties in the homepage product carousel. Normal runs do not update screenshots.
To update baselines after an intentional UI change, run from the MageLens root
and review all changed images:

```sh
./bin/application-compose exec -T runner npx playwright test --config=playwright.config.cjs --grep visual_baseline --update-snapshots=all --reporter=list
```

The store uses standard Magento checkout, flat-rate shipping, check/money-order
payment and fixed USD/EUR rates. Licensed Hyvä Checkout is not part of this
benchmark. Keep store-specific changes in `benchmark/` when preparing an
upstream contribution.
