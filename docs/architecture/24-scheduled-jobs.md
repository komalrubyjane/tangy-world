# 24 — Scheduled Job Architecture

## Schedulers in the repository

| Scheduler | What | Cadence | Defined where | Status |
|---|---|---|---|---|
| pg_cron job `tangy-platform-jobs` | `select public.run_platform_jobs()` | `*/5 * * * *` (every 5 min) | 0020: `create extension if not exists pg_cron; cron.schedule(...)` inside a `do` block that only runs if `pg_cron` is available, otherwise it raises a notice to schedule externally | **IMPLEMENTED** (auto-created when the extension exists). Production confirmation is an operator step (`docs/OPERATIONS.md` §2a Step 1) |
| pg_cron job `tangy-log-expired-access` | `select public.log_expired_access()` | `*/5 * * * *` | 0018, only if `pg_cron` was **already installed** at that point | **Conditional.** The same work also runs inside `run_platform_jobs`, so it is redundant when present |
| Email drain | `POST /functions/v1/send-notification-emails` with `x-cron-secret` | every 1–2 min (runbook) | **Not in code**: Supabase Cron HTTP job or an external scheduler | **PRODUCTION CONFIGURATION, not done** |
| Opportunistic runs | `expire_stale_bookings()` | before every checkout | `create_pending_booking` | **IMPLEMENTED** |
| | `expire_booking_requests()` | before every artist response | `respond_to_booking_request` | **IMPLEMENTED** |
| | `offer_waitlist_seats()` | on every seat release / capacity change | triggers | **IMPLEMENTED** |
| Local manual run | `scripts/run-jobs.sh [emails]` | on demand | script | **DEMO / LOCAL ONLY** |

## run_platform_jobs()

```mermaid
---
title: run_platform_jobs — single-flight job runner (every 5 minutes)
---
flowchart TD
  classDef start fill:#1f6f43,color:#fff
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  C(["pg_cron tangy-platform-jobs */5"]):::start --> L{"pg_try_advisory_xact_lock<br/>'tangy.run_platform_jobs'"}:::dec
  L -- "busy" --> SK["platform_job_runs row skipped=true<br/>(another run in progress)"]:::err
  L -- acquired --> R["platform_job_runs row started"]:::db
  R --> J1["expire_stale_bookings<br/>pending unpaid > 30 min → expired · notify customer · audit · seats → waitlist"]:::db
  J1 --> J2["expire_waitlist_offers<br/>lapsed offers → expired · notify · offer onwards"]:::db
  J2 --> J3["expire_booking_requests<br/>pending artist requests past expires_at → expired"]:::db
  J3 --> J4["send_event_reminders<br/>members of events starting within 24 h · event_reminders_sent dedupe"]:::db
  J4 --> J5["notify_overdue_tasks<br/>assignee + team.manage · overdue_notified_at marker"]:::db
  J5 --> J6["notify_expiring_access<br/>volunteer grants about to end · expiring_notified_at"]:::db
  J6 --> J7["log_expired_access<br/>audit access.expired · expiry_logged_at"]:::db
  J7 --> J8["send_availability_reminders<br/>artists with calendars older than 30 days"]:::db
  J8 --> F["platform_job_runs finished_at + result jsonb (counts)"]:::res
```

| Job | Tables affected | Notifications | Email | Audit / log |
|---|---|---|---|---|
| `expire_stale_bookings` | bookings → expired | `booking_payment.expired` | no (catalogue email = false) | `booking.expired` |
| `expire_waitlist_offers` | waitlist → expired, new offers | `waitlist.offer_expired`, `waitlist.offer` | yes | `waitlist.offered` |
| `expire_booking_requests` | assignment_requests → expired | `booking.expired` to the requester (trigger) | no | — |
| `send_event_reminders` | event_reminders_sent | `event.reminder` | yes | — |
| `notify_overdue_tasks` | event_tasks.overdue_notified_at | `task.overdue` | no | — |
| `notify_expiring_access` | temporary_access.expiring_notified_at | `access.expiring` | no | — |
| `log_expired_access` | temporary_access.expiry_logged_at | — | — | `access.expired` |
| `send_availability_reminders` | none (dedupe = an `availability.reminder` notification in the last N days) | `availability.reminder` | no | — |
| every run | platform_job_runs | — | — | run log readable with `operations.manage` |

Every job is **idempotent**: it touches only eligible rows and stamps markers, uses `for update skip locked` where rows are claimed, and the runner holds a transaction-scoped advisory lock. Tests: `supabase/tests/media_realtime_jobs.test.sql` (run once, run twice, expired and already-processed records) and `scripts/test-concurrency.sh` (overlapping runs).

## Email drain

```mermaid
---
title: Email drain — operator-scheduled HTTP job
---
sequenceDiagram
  autonumber
  participant S as Scheduler (PRODUCTION CONFIGURATION)
  participant F as send-notification-emails
  participant DB as Postgres
  participant R as Resend
  loop every 1–2 minutes
    S->>F: POST · x-cron-secret
    F->>F: secret matches? provider configured?
    F->>DB: claim_email_batch(25) · FOR UPDATE SKIP LOCKED
    DB-->>F: rows (status sending, attempts+1)
    F->>R: send each
    F->>DB: complete_email(id, ok, error) → sent / queued again / failed (5 attempts)
  end
```
