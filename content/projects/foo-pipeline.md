---
title: Data pipeline
company: Foo (placeholder)
period: 2020-01 — 2022-02
role: Senior Backend Engineer
headline: Built a change-data-capture pipeline that cut analytics latency from 24 h to 5 min.
order: 20
skills:
  PostgreSQL: Set up logical replication (CDC) from production PostgreSQL into the warehouse.
  TypeScript: Wrote the stream consumers in TypeScript.
---
## Context

Placeholder project. Foo's analytics team worked with data that was a day old, because the warehouse was refreshed by a nightly dump.

## What I did

- Replaced the nightly dump with change data capture (CDC) based on PostgreSQL logical replication.
- Built stream consumers that load changes into the warehouse.

## Results

- Analytics latency: 24 h → 5 min.
- The approach was later reused for the [[acme-billing|billing platform]] reporting.
