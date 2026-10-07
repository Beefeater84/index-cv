---
title: Billing platform
company: Acme (placeholder)
period: 2022-03 — 2024-01
role: Tech Lead
team: 6 engineers
headline: Rebuilt the billing platform; monthly reports went from 40 s to 3 s.
order: 10
skills:
  PostgreSQL: Designed the billing schema with monthly partitioning (~2 TB); reports went from 40 s to 3 s.
  Kubernetes: Migrated 12 billing services from VMs to Kubernetes with zero downtime.
  TypeScript: Wrote the invoicing API in TypeScript (Node.js).
---
## Context

Placeholder project. Acme sells subscriptions to ~50,000 business customers. The legacy billing system produced invoices with a nightly batch job and monthly reports took 40 seconds to load.

## What I did

- Led a team of 6 engineers through a full rewrite of the billing platform.
- Designed a partitioned PostgreSQL schema for invoices and payments.
- Moved the services to Kubernetes and introduced blue-green deployments.

## Results

- Monthly reports: 40 s → 3 s.
- Invoice generation moved from a nightly batch to real time.
- Zero billing incidents during the migration.

The data from this platform fed the [[foo-pipeline]].
