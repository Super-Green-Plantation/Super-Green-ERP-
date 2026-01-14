app/api/src/folder/name.ts - - - - > pure fetch function
app/components/folder/name.tsx - - - - > UI component
app/features/folder/name.ts - - - - > ui pages
app/hooks/name.ts - - - - > custom hooks, tanstack query hooks
providers.tsx - - - - > tanstack query providers
app/api/utils/prisma - - - - > prisma client instance

app/api/src/_tests__/folder/name.test.ts - - - - > api tests


# Pooler → runtime only
DATABASE_URL="postgresql://postgres:tdHKAuux5qat6VHl@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection → migrations only
DIRECT_URL="postgresql://postgres:tdHKAuux5qat6VHl@db.itcfwcgidijtnfjepsyk.supabase.co:5432/postgres?sslmode=require"

# Neon connection string
# DATABASE_URL="postgresql://neondb_owner:npg_YHgCTeIz8x3J@ep-dark-block-a1osurrw-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# tdHKAuux5qat6VHl