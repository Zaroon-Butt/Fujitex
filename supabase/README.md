# Supabase setup

Project ref: `ewrywsrmiyovcxwceeaf`

## Apply migrations

**Option A — Supabase Dashboard SQL editor**
Open the SQL editor and run each file in order:
1. `migrations/20260526000001_initial_schema.sql`
2. `migrations/20260526000002_rls_policies.sql`
3. `migrations/20260526000003_seed.sql`

**Option B — Supabase CLI**
```
supabase link --project-ref ewrywsrmiyovcxwceeaf
supabase db push
```

**Option C — MCP server (once authenticated in a regular terminal via `claude /mcp`)**
Use the `apply_migration` MCP tool with each file's contents.

## Promote yourself to admin

After signing up via the storefront, run in the SQL editor:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

## Storage buckets

Create a public bucket named `product-images` for product photos (WebP).
