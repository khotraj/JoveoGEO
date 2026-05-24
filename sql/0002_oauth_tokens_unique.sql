-- Migration 0002: add unique constraint on oauth_tokens.connection_id
-- One token set per connection (delete + re-insert on re-auth).
-- Run after 0001_init.sql.

alter table oauth_tokens
  add constraint uq_oauth_tokens_connection unique (connection_id);
