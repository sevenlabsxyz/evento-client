# Decisions

## 2026-02-14 Task: Planning

- Email template split: sender confirmation + recipient invite (user confirmed)
- Test strategy: tests-after (user confirmed)
- Dedupe: 24h per sender->recipient pair (user confirmed)
- Backend notify endpoint: client calls through existing API proxy, backend handles Trigger.dev
- No Trigger.dev setup needed in client repo — only a mutation hook calling the backend endpoint
