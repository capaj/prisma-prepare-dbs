import 'dotenv/config'
import os from 'os'

import { execFile } from 'child_process'
import { PrismaClient } from '@prisma/client'

export const prismaPrepareDbs = async ({
  prismaClient,
  dbConnection,
  rootDbName,
  dbCount = os.cpus().length // each jest worker uses one CPU and one DB, so we need that many DBs
}: {
  prismaClient: PrismaClient
  dbConnection: string
  rootDbName: string
  dbCount: number
}) => {
  const dbUrl = process.env.DB_CONNECTION?.split(dbConnection)[0]

  const migrateOneDb = async (dbName: string) => {
    const command = 'reset'
    // Currently we don't have any direct method to invoke prisma migration programmatically.
    // As a workaround, we spawn migration script as a child process and wait for its completion.
    // Please also refer to the following GitHub issue: https://github.com/prisma/prisma/issues/4703

    await prismaClient.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${dbName};`)
    await prismaClient.$executeRawUnsafe(`CREATE DATABASE ${dbName}`)
    try {
      const exitCode = await new Promise((resolve) => {
        const DB_CONN = `${dbUrl}${dbName}`

        execFile(
          './node_modules/prisma/build/index.js',
          ['migrate', command, '--force', '--skip-generate'],
          {
            env: {
              ...process.env,
              DB_CONNECTION: DB_CONN
            }
          },
          (error) => {
            console.log(`Migrated ${DB_CONN}`)

            if (error !== null) {
              console.log(`prisma exited with error ${error.message}`)
              resolve(error.code ?? 1)
            } else {
              resolve(0)
            }
          }
        )
      })

      if (exitCode !== 0) {
        throw Error(`command failed with exit code ${exitCode}`)
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  await Promise.all(
    Array.from({ length: dbCount }, (_, index) =>
      migrateOneDb(`${rootDbName}_${index + 1}`)
    )
  )

  console.log(`All ${dbCount} test databases migrated successfully`)
}
