---
name: springboot-service-skeleton
description: 'Use when: tao service moi Spring Boot (boilerplate). Keywords: spring boot, service skeleton, application.yml, swagger, flyway, postgres.'
argument-hint: 'Ten service + package base + port'
---

# Spring Boot Service Skeleton

## When to Use
- Tao service moi theo mau user-service
- Can bo cuc project, package, main class, application.yml

## Procedure
1. Tao main class `@SpringBootApplication` va `@EnableScheduling` neu can.
2. Tao `application.yml` gom: server.port, spring.application.name, datasource postgres, flyway, redis, jwt, swagger, logging.
3. Tao README/HELP neu can (theo mau co san).
4. Dam bao profiles `dev`/`prod` thong qua `spring.profiles.active`.

## Output Checklist
- Co `UserServiceApplication`-style main class
- Co `application.yml` day du tham so
- Co cau hinh swagger + actuator
