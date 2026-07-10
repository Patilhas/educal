import { Redis } from "@upstash/redis";

export const clone = <T>(value: T): T => structuredClone(value);
const CACHE_REVALIDATE_MS = 500;

/**
 * Base class for Redis-backed repositories that store their entire domain
 * as a single JSON blob under one key, with in-memory caching and a write
 * queue to serialize mutations.
 */
export abstract class RedisDbStore<TDb> {
  private writeQueue: Promise<void> = Promise.resolve();
  private cachedDb: TDb | null = null;
  private lastCacheValidationAt = 0;
  private redis = Redis.fromEnv();

  protected constructor(
    private readonly key: string,
    private readonly onMissing: (raw: TDb | null) => TDb,
  ) {}

  protected async readDb(): Promise<TDb> {
    await this.writeQueue;

    const now = Date.now();
    if (this.cachedDb && now - this.lastCacheValidationAt < CACHE_REVALIDATE_MS) {
      return this.cachedDb;
    }

    const db = this.onMissing((await this.redis.get(this.key)) as TDb | null);
    this.cachedDb = db;
    this.lastCacheValidationAt = now;

    return db;
  }

  protected async persistDb(mutate: (db: TDb) => TDb): Promise<void> {
    await this.persistDbWithResult((db) => ({ db: mutate(db), result: undefined }));
  }

  protected async persistDbWithResult<R>(
    mutate: (db: TDb) => { db: TDb; result: R },
  ): Promise<R> {
    let result!: R;
    this.writeQueue = this.writeQueue.then(async () => {
      const db = this.onMissing((await this.redis.get(this.key)) as TDb | null);
      const { db: nextDb, result: r } = mutate(db);
      await this.redis.set(this.key, JSON.stringify(nextDb));
      this.cachedDb = clone(nextDb);
      this.lastCacheValidationAt = Date.now();
      result = r;
    });
    await this.writeQueue;
    return result;
  }
}
