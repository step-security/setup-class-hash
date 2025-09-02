# Setup starknet-class-hash action

Downloads and installs the starknet-class-hash CLI tool for use in GitHub Actions workflows.

## Example workflow

```yaml
name: Set up starknet-class-hash
on:
  push:
jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: step-security/setup-class-hash@v1
        with:
          version: "0.2.0"
      - run: class_hash get --json
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Version of starknet-class-hash to install (e.g., '0.1.0' or 'v0.1.0') | Yes | - |