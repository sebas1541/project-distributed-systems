# Shared Module

This directory contains shared code and configurations used across all microservices.

## Contents

- `types/` - TypeScript interfaces and types
- `rabbitmq.config.ts` - RabbitMQ configuration for message broker

## Usage

Services can import shared types and configurations from this directory:

```typescript
import { rabbitMQConfig } from '../../shared/rabbitmq.config';
import { Task, TaskStatus } from '../../shared/types/task.types';
```

## Future Additions

Week 3+ will add:
- Common middleware
- Shared utilities
- Error handling helpers
- Logger configuration
