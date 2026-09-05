-- Index foreign keys and evaluate request identity once per statement.
begin;
create index audit_actor_idx on private.audit_log(actor_id);
create index reports_reporter_idx on private.comment_reports(reporter_id);
create index corrections_article_idx on private.corrections(article_id);
create index corrections_author_idx on private.corrections(author_id);
create index roles_granter_idx on private.user_roles(granted_by);
create index bookmarks_article_idx on public.bookmarks(article_id);
create index documents_edition_idx on public.documents(edition_id);
alter policy articles_read on public.articles using (
 (status='published' and published_at<=now()) or (select private.has_role(array['editor'])) or (author_id=(select auth.uid()) and (select private.has_role(array['journalist']))));
alter policy profile_own on public.reader_profiles using(id=(select auth.uid()) and (select private.is_member()));
alter policy comments_read on public.comments using (
 (status='approved' and private.article_public(article_id)) or (author_id=(select auth.uid()) and (select private.is_member())) or (select private.has_role(array['moderator'])));
alter policy bookmarks_own on public.bookmarks using(user_id=(select auth.uid()) and (select private.is_member()));
alter policy updates_read on public.session_updates using(
 (published and exists(select 1 from public.sessions s where s.id=session_id and s.published)) or (select private.has_role(array['editor'])) or (author_id=(select auth.uid()) and (select private.has_role(array['journalist']))));
notify pgrst,'reload schema';
commit;
