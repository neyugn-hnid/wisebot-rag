---
name: mapper-manual-page
description: 'Use when: tao mapper thu cong, map Page -> response list. Keywords: mapper, page response, manual mapping.'
argument-hint: 'Entity + response can map'
---

# Manual Mapper + Page Response

## When to Use
- Can map entity sang response dto
- Can map Page<Entity> thanh PageResponse

## Procedure
1. Tao class `@Component` mapper thu cong.
2. Map tung field can thiet.
3. Dung `Page.stream().map(...)` -> list.
4. Build `PageResponse` voi pageNumber/pageSize/total.

## Output Checklist
- Mapper khong tra entity truc tiep
- Co null guard khi can
