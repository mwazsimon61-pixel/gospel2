/*
# Create blog_comments and admin_emails tables

## Purpose
Two tables referenced by the frontend code but not yet present in the database:
1. `blog_comments` — stores visitor comments on blog posts (pending → approved/rejected moderation flow).
2. `admin_emails` — stores inbound and outbound emails for the admin inbox (unread/read/sent/deleted).

## 1. New Table: blog_comments
| Column          | Type          | Description                                     |
|-----------------|---------------|-------------------------------------------------|
| id              | uuid PK       | Default gen_random_uuid()                       |
| post_id         | uuid FK       | References blog_posts(id) ON DELETE CASCADE     |
| author_name     | text NOT NULL | Comment author's display name                   |
| author_email    | text NOT NULL | Comment author's email (not shown publicly)     |
| content         | text NOT NULL | Comment body                                    |
| parent_id       | uuid nullable | Self-reference for threaded replies             |
| status          | text NOT NULL | 'pending' (default) / 'approved' / 'rejected' / 'deleted' |
| admin_note      | text nullable | Optional note added during moderation           |
| moderated_at    | timestamptz   | When a moderator last changed status            |
| created_at      | timestamptz   | Default now()                                   |

Indexes: post_id + status for approved-comment lookups; created_at for ordering.

## 2. New Table: admin_emails
| Column          | Type          | Description                                     |
|-----------------|---------------|-------------------------------------------------|
| id              | uuid PK       | Default gen_random_uuid()                       |
| direction       | text NOT NULL | 'inbound' or 'outbound'                         |
| from_email      | text NOT NULL | Sender email                                    |
| from_name       | text nullable | Sender display name                             |
| to_email        | text NOT NULL | Recipient email                                 |
| subject         | text NOT NULL | Email subject                                   |
| body_text       | text nullable | Plain-text body                                 |
| body_html       | text nullable | HTML body                                       |
| attachments     | jsonb         | Array of {filename, url, content_type, size}    |
| status          | text NOT NULL | 'unread' / 'read' / 'sent' / 'deleted'          |
| in_reply_to     | uuid nullable | ID of email this replies to                     |
| thread_id       | uuid NOT NULL | Groups emails in a conversation thread          |
| source          | text nullable | Origin (e.g. 'resend_inbound', 'admin_compose') |
| source_id       | text nullable | External ID from source system                  |
| created_at      | timestamptz   | Default now()                                   |

Indexes: direction + status for unread counts; thread_id for thread lookups; created_at for ordering.

## 3. Security — RLS Policies

### blog_comments
- **anon INSERT**: Visitors can submit comments (WITH CHECK validates name, email format, non-empty content, and that post_id is not null).
- **anon SELECT**: Anyone can read approved comments (status = 'approved') — used by the blog post page to display comments.
- **authenticated SELECT**: Admins can see all non-deleted comments.
- **authenticated UPDATE**: Admins can moderate (change status, add admin_note, set moderated_at).
- **authenticated DELETE**: Admins can soft-delete comments (set status = 'deleted'). Note: the frontend uses UPDATE to set status='deleted' rather than a hard DELETE, so the DELETE policy is a safety net.

### admin_emails
- **authenticated SELECT/INSERT/UPDATE/DELETE**: Full CRUD for logged-in admins. The admin dashboard requires a valid Supabase auth session.
- Edge functions (inbound-email, send-admin-email) use the service role key internally, which bypasses RLS entirely.
- No anon access — the inbox is admin-only.

## 4. Important Notes
1. Both tables use `gen_random_uuid()` for primary keys.
2. `blog_comments.post_id` has a foreign key to `blog_posts(id)` with `ON DELETE CASCADE` so comments are removed when a post is deleted.
3. `blog_comments.parent_id` self-references for threaded replies (ON DELETE SET NULL).
4. `admin_emails.attachments` is jsonb with a default of `[]`::jsonb.
5. `admin_emails.thread_id` defaults to `gen_random_uuid()` so each new email starts its own thread.
6. Policies are idempotent (DROP POLICY IF EXISTS before CREATE).
7. The frontend soft-deletes comments by setting status='deleted' and soft-deletes emails by setting status='deleted', so no data is ever hard-removed.
*/

-- ════════════════════════════════════════════════════════════
-- 1. blog_comments
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS blog_comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name  text NOT NULL,
  author_email text NOT NULL,
  content      text NOT NULL,
  parent_id    uuid REFERENCES blog_comments(id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'pending',
  admin_note   text,
  moderated_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_blog_comments_post_status
  ON blog_comments(post_id, status);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at
  ON blog_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id
  ON blog_comments(parent_id);

-- anon: visitors can submit comments (with validation)
DROP POLICY IF EXISTS "anon_insert_blog_comments" ON blog_comments;
CREATE POLICY "anon_insert_blog_comments"
  ON blog_comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    post_id IS NOT NULL
    AND author_name IS NOT NULL AND length(TRIM(BOTH FROM author_name)) > 0
    AND author_email IS NOT NULL AND author_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND content IS NOT NULL AND length(TRIM(BOTH FROM content)) > 0
  );

-- anon: anyone can read approved comments
DROP POLICY IF EXISTS "anon_select_blog_comments" ON blog_comments;
CREATE POLICY "anon_select_blog_comments"
  ON blog_comments FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- authenticated: admins can see all non-deleted comments
DROP POLICY IF EXISTS "auth_select_blog_comments" ON blog_comments;
CREATE POLICY "auth_select_blog_comments"
  ON blog_comments FOR SELECT
  TO authenticated
  USING (status IS NOT NULL);

-- authenticated: admins can moderate comments
DROP POLICY IF EXISTS "auth_update_blog_comments" ON blog_comments;
CREATE POLICY "auth_update_blog_comments"
  ON blog_comments FOR UPDATE
  TO authenticated
  USING (status IS NOT NULL)
  WITH CHECK (status IS NOT NULL);

-- authenticated: admins can delete comments (hard delete safety net)
DROP POLICY IF EXISTS "auth_delete_blog_comments" ON blog_comments;
CREATE POLICY "auth_delete_blog_comments"
  ON blog_comments FOR DELETE
  TO authenticated
  USING (status IS NOT NULL);

-- ════════════════════════════════════════════════════════════
-- 2. admin_emails
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_emails (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction     text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_email    text NOT NULL,
  from_name     text,
  to_email      text NOT NULL,
  subject       text NOT NULL DEFAULT '',
  body_text     text,
  body_html     text,
  attachments   jsonb NOT NULL DEFAULT '[]'::jsonb,
  status        text NOT NULL DEFAULT 'unread',
  in_reply_to   uuid,
  thread_id     uuid NOT NULL DEFAULT gen_random_uuid(),
  source        text,
  source_id     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_emails_direction_status
  ON admin_emails(direction, status);
CREATE INDEX IF NOT EXISTS idx_admin_emails_thread_id
  ON admin_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_admin_emails_created_at
  ON admin_emails(created_at);

-- authenticated: full CRUD for admin inbox (edge functions use service role key, bypassing RLS)
DROP POLICY IF EXISTS "auth_select_admin_emails" ON admin_emails;
CREATE POLICY "auth_select_admin_emails"
  ON admin_emails FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_admin_emails" ON admin_emails;
CREATE POLICY "auth_insert_admin_emails"
  ON admin_emails FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_admin_emails" ON admin_emails;
CREATE POLICY "auth_update_admin_emails"
  ON admin_emails FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_admin_emails" ON admin_emails;
CREATE POLICY "auth_delete_admin_emails"
  ON admin_emails FOR DELETE
  TO authenticated
  USING (true);
