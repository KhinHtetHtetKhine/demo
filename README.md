# Demo Repository

A collection of automation demo projects built with Playwright and TypeScript, showcasing real-world test engineering patterns used in production test suites.

---

## What this repo demonstrates

- End-to-end UI test automation with Playwright
- Page Object Model (POM) structure
- Fixture-based test architecture with shared utilities
- CSV-driven data separation from test logic
- Parallel-safe authenticated session caching
- Multi-environment configuration via `.env` files
- CI/CD integration with GitHub Actions
- Automated test report publishing to GitHub Pages

---

## Projects

### [`e2e-login-demo/`](./e2e-login-demo)

A full E2E test suite for login and inventory flows targeting [saucedemo.com](https://www.saucedemo.com).

| What it covers |
|---|
| Login form validation (valid, invalid, locked user) |
| Authenticated session reuse across parallel workers |
| Inventory page — product count, add to cart, cart badge |
| Unified CSV test data with feature discriminator |
| Cross-platform npm scripts via `cross-env` |
| GitHub Actions CI with report publishing |

**CI Status:** [![Demo Playwright CI](https://github.com/KhinHtetHtetKhine/demo/actions/workflows/demo-playwright-ci.yml/badge.svg)](https://github.com/KhinHtetHtetKhine/demo/actions/workflows/demo-playwright-ci.yml)

**Live Report:** [View on GitHub Pages](https://khinhtethtetkhine.github.io/demo/playwright-report/)

→ See [`e2e-login-demo/README.md`](./e2e-login-demo/README.md) for full documentation.

---

## Tech Stack

- [Playwright](https://playwright.dev/) — browser automation
- [TypeScript](https://www.typescriptlang.org/) — type safety
- [dotenv](https://github.com/motdotla/dotenv) — environment config
- [cross-env](https://github.com/kentcdodds/cross-env) — cross-platform env vars
- [GitHub Actions](https://github.com/features/actions) — CI/CD
- [GitHub Pages](https://pages.github.com/) — report hosting
