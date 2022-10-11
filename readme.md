# prisma-prepare-dbs

Utility for preparing multiple DBs with the same schema. This is helpful for example in CI for functional/integration testing when you want to run multiple vitest/jest workers each against one DB instance.

## Usage

```ts
import { prismaPrepareDbs } from 'prisma-prepare-dbs'

prismaPrepareDbs({
  prismaClient,
  dbConnection: 'postgresql://user:pass@localhost:5432/myProject_test',
  rootDbName: 'myProject_test'
})
```
