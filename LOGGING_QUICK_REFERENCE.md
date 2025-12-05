# Logging System - Quick Reference

## Set Log Level

```bash
# Production (clean logs) - DEFAULT
LOG_LEVEL=2

# Development (moderate logs)
LOG_LEVEL=3

# Debugging (verbose logs)
LOG_LEVEL=4

# Errors only
LOG_LEVEL=0
```

## Log Levels

| Level | Name | What's Logged | Use When |
|-------|------|---------------|----------|
| 0 | ERROR | Errors only | Testing |
| 1 | WARN | Errors + warnings | Minimal logging |
| 2 | INFO | Errors + warnings + info | **Production** ✅ |
| 3 | DEBUG | + debug details | Development |
| 4 | TRACE | Everything | Debugging issues |

## Expected Log Volume

| Level | Logs/Minute | Use Case |
|-------|-------------|----------|
| INFO (2) | ~20 | Production |
| DEBUG (3) | ~50 | Development |
| TRACE (4) | ~200 | Debugging |

## Quick Examples

### Production Logs (LOG_LEVEL=2)

```
[Worker] Starting hybrid event-driven job worker...
[Worker] Job created, processing immediately
[Worker] Processing batch: 100 items from 5 store(s)
[Worker] Batch complete: 100 items in 13s
[Worker] ✅ 5 job(s) completed
```

**Clean and minimal** ✅

### Debug Logs (LOG_LEVEL=3)

```
[Worker] Processing batch: 100 items from 5 store(s)
  Store a326af78...: 20 items
  Store b437cf89...: 20 items
  Store c548dg90...: 20 items
[Worker] ✅ Item 281 complete
[Worker] ✅ Item 282 complete
[Worker] Batch complete: 100 items in 13s
```

**More detail for debugging** ✅

## Troubleshooting

### Too many logs?
```bash
LOG_LEVEL=2  # Reduce to INFO
```

### Not seeing logs?
```bash
LOG_LEVEL=3  # Increase to DEBUG
```

### Need full detail?
```bash
LOG_LEVEL=4  # Enable TRACE
```

## What Changed

- **Database queries:** Only slow queries (> 100ms) logged
- **Auth verification:** Only failures logged
- **Worker processing:** Batch summaries instead of individual items
- **Wix API calls:** Only errors logged

## Result

**98% fewer logs in production** while maintaining full debugging capability when needed.
