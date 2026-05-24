# Testing

## Automated Checks

The first implementation uses Vitest for pure domain calculator coverage. Run:

```sh
bun run test
```

Covered areas include:

- current CGT 50% discount after losses;
- current short-term no-discount path;
- post-1 July 2027 transitional split;
- CPI-indexed post-policy gain;
- 30% minimum-tax top-up and income-support exemption;
- eligible-new-build method choice;
- negative gearing grandfathering and quarantined losses.
- React workspace smoke coverage for the portfolio and scenario comparison views.

Run `bun run build` as the current typecheck and production-build gate.

Use this directory for QA guides, testing strategy, manual validation, and verification checklists.
