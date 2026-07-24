
## Assistant

Good. Here's the full beginner-friendly breakdown.

---

## The big picture of `common/`

You already know the pattern: **Module → Controller → Service**. The `common/` folder follows the exact same idea, except it has **no controller** — because it's not responding to HTTP requests. It's a box of reusable tools that any other module (Rider, Admin, Driver…) can borrow.

```
common/
 ├── common.module.ts              ← the "lending library" module
 ├── pipes/
 │   └── profile-picture-validation.pipe.ts   ← a gatekeeper
 ├── profile-picture/
 │   └── profile-picture.service.ts           ← shared business logic
 └── storage/
     ├── storage.interface.ts      ← a contract / rulebook
     ├── storage.module.ts         ← wires the storage strategy
     └── local-storage.service.ts  ← the actual storage worker
```

---

## 1. `@Injectable()` vs `@Inject()`

These sound similar but do completely different jobs.

### `@Injectable()` — "I am available to be used"

You put this **on a class**. It tells NestJS:

> *"This class is a service. You are allowed to create it and give it to whoever needs it."*

```ts
@Injectable()
export class StorageService {
  // NestJS can now manage this class
}
```

Think of it like hanging a sign on a shop that says **"Open — come in and use me"**. Without `@Injectable()`, NestJS doesn't know the class exists and refuses to inject it anywhere.

You already do this every time you write a service — `RiderService`, `AdminService`, etc. all have `@Injectable()`.

---

### `@Inject()` — "Give me this specific thing"

You put this **on a constructor parameter**. It tells NestJS:

> *"When you create this class, please hand me this specific dependency."*

```ts
constructor(
  @Inject(STORAGE_SERVICE)
  private readonly storageService: IStorageService,
) {}
```

You've already used the automatic version of this — when you write `private readonly riderService: RiderService` in a constructor, NestJS figures out what to inject by reading the TypeScript type. That's the normal, easy case.

`@Inject()` is needed when the normal automatic way **can't work** — which leads us to `STORAGE_SERVICE`.

---

## 2. What is `STORAGE_SERVICE`?

### The problem it solves

Normally NestJS identifies what to inject using the **class name itself** as the key. So when you write:

```ts
constructor(private readonly riderService: RiderService) {}
```

NestJS looks up `RiderService` in its registry and hands you an instance. Simple.

But in `ProfilePictureService` we wrote:

```ts
constructor(
  private readonly storageService: IStorageService,
) {}
```

`IStorageService` is an **interface** — a TypeScript-only concept that completely disappears at runtime (JavaScript doesn't have interfaces). NestJS cannot look it up because it simply doesn't exist once the code runs. NestJS would crash trying to find it.

---

### The solution: a string token

`STORAGE_SERVICE` is just a plain string that acts as a **name tag**:

```ts
// storage.module.ts
export const STORAGE_SERVICE = 'STORAGE_SERVICE';
```

It's literally `'STORAGE_SERVICE'` — nothing magic. You then tell NestJS two things using this tag:

**"Register `StorageService` under this name tag"** (in the module):
```ts
providers: [
  {
    provide: STORAGE_SERVICE,   // name tag
    useClass: StorageService,   // the real class behind it
  },
],
```

**"Give me whatever is registered under this name tag"** (in the constructor):
```ts
@Inject(STORAGE_SERVICE)
private readonly storageService: IStorageService,
```

So at runtime, NestJS does: *"They asked for `'STORAGE_SERVICE'` → I have `StorageService` registered under that name → here it is."*

---

### Why is this useful?

Because tomorrow you can swap `LocalStorageService` for `S3StorageService` by changing **one line** in `storage.module.ts`:

```ts
// Before
{ provide: STORAGE_SERVICE, useClass: StorageService }

// After — swap to S3, nothing else in the codebase changes
{ provide: STORAGE_SERVICE, useClass: S3StorageService }
```

`ProfilePictureService`, `RiderService`, `AdminService` — none of them need to change. They all just ask for `STORAGE_SERVICE` and get whatever is behind it. This is the **Strategy Pattern**.

---

## 3. `IStorageService` — the contract

```ts
export interface IStorageService {
  upload(file, folder): Promise<string>;
  delete(fileUrl): Promise<void>;
}
```

This is a **rulebook**. It says: *"Anyone who claims to be a storage service MUST have these two methods."*

`StorageService` signs that contract with `implements`:
```ts
export class StorageService implements IStorageService {
  // forced to write upload() and delete()
}
```

If you later write `S3StorageService`, it also `implements IStorageService` — same contract, different implementation. The rest of your app never cares which one it's talking to.

---

## 4. The Pipe — a gatekeeper before the service

```ts
export class ProfilePictureValidationPipe implements PipeTransform<Express.Multer.File> {
  transform(file: Express.Multer.File): Express.Multer.File {
    // checks run here BEFORE the controller method runs
  }
}
```

A **Pipe** sits between the incoming HTTP request and your controller method. Think of it like a security guard at the door:

```
HTTP Request → [Pipe checks the file] → Controller → Service → DB
                   ↑
         throws an error here if file is bad,
         controller never even runs
```

This is why the Rider and Admin controllers can both use the same `ProfilePictureValidationPipe` — the validation logic lives in one place, not copy-pasted into every service.

---

## The full flow, plain English

```
POST /v1/api/rider/:id/profile-picture
         │
         ▼
ProfilePictureValidationPipe
  • Is a file attached?
  • Is it jpeg/png/webp?
  • Is it under 5 MB?
  • NO → throw error immediately
  • YES → pass the file through
         │
         ▼
RiderController.uploadProfilePicture()
         │
         ▼
RiderService.uploadProfilePicture()
  • Find rider in DB (throw 404 if not found)
  • Call profilePictureService.replace(...)
         │
         ▼
ProfilePictureService.replace()       ← lives in common/, reused by Admin too
  • Delete old file if one exists
  • Call storageService.upload(file, 'riders')
         │
         ▼
StorageService (LocalStorageService)  ← registered under STORAGE_SERVICE token
  • Save file to disk
  • Return the URL
         │
         ▼
Back up the chain → { profilePictureUrl: '/uploads/riders/abc.jpg' }
```
