---
name: entity-jpa-modeling
description: 'Use when: tao entity JPA, quan he, enum, timestamp. Keywords: entity, jpa, relationship, uuid, enum.'
argument-hint: 'Danh sach entity + bang lien quan'
---

# Entity JPA Modeling

## When to Use
- Tao entity moi theo mau UserEntity/Tenant/Role/TenantInvite/AuditLog
- Can UUID primary key, enum, quan he 1-n, n-n

## Procedure
1. Dung `@Entity`, `@Table` va `@Id` voi `GenerationType.UUID`.
2. Dinh nghia quan he `@ManyToOne`, `@OneToMany`, `@ManyToMany` nhu mau.
3. Dung `@Enumerated(EnumType.STRING)` cho enum.
4. Dung `@CreationTimestamp`/`@UpdateTimestamp` cho created/updated.
5. Dung `@Column` de set length, nullable, unique.

## Output Checklist
- Entity co UUID id
- Quan he ro rang, map dung bang
- Enum luu kieu string
