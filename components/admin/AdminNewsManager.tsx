'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { categoryLabels } from '@/data/news';
import {
  categories,
  emptyArticle,
  parseArticleBody,
  stringifyArticleBody,
  type EditableArticle
} from '@/lib/admin-news';
import {
  fetchAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadCoverImage,
} from '@/lib/supabase-articles';

type Mode = 'idle' | 'creating' | 'editing';

export function AdminNewsManager() {
  const [news, setNews] = useState<EditableArticle[]>([]);
  const [mode, setMode] = useState<Mode>('idle');
  const [editBuffer, setEditBuffer] = useState<EditableArticle | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const articles = await fetchAllArticles();
      setNews(articles);
    } catch {
      showMsg('Erro ao carregar notícias.', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  function showMsg(msg: string, error = false) {
    setMessage(msg);
    setIsError(error);
  }

  function openForm(article: EditableArticle, slug: string | null, m: Mode) {
    setEditBuffer({ ...article });
    setRawContent(stringifyArticleBody(article.content));
    setOriginalSlug(slug);
    setMode(m);
    setMessage('');
  }

  function handleNew() {
    const draft: EditableArticle = {
      ...emptyArticle(),
      slug: `nova-materia-${Date.now()}`,
      title: '',
      subtitle: '',
      author: '',
      date: '',
      readingTime: '5 min',
      coverImage: '',
      content: ['']
    };
    openForm(draft, null, 'creating');
  }

  function handleSelect(article: EditableArticle) {
    openForm(article, article.slug, 'editing');
  }

  function updateField<K extends keyof EditableArticle>(field: K, value: EditableArticle[K]) {
    setEditBuffer((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const raw = e.target.value;
    setRawContent(raw);
    const paragraphs = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    updateField('content', paragraphs.length > 0 ? paragraphs : ['']);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    showMsg('Enviando imagem...');
    try {
      const url = await uploadCoverImage(file);
      updateField('coverImage', url);
      showMsg('\u2713 Imagem enviada com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showMsg('Erro no upload: ' + msg, true);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSave() {
    if (!editBuffer) return;
    const paragraphs = rawContent.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const toSave: EditableArticle = {
      ...editBuffer,
      content: paragraphs.length > 0 ? paragraphs : [''],
    };
    setSaving(true);
    showMsg('');
    try {
      if (mode === 'creating') {
        await createArticle(toSave);
        showMsg('\u2713 Matéria publicada com sucesso!');
      } else if (mode === 'editing' && originalSlug) {
        await updateArticle(originalSlug, toSave);
        showMsg('\u2713 Alterações salvas com sucesso!');
      }
      await loadArticles();
      setOriginalSlug(toSave.slug);
      setMode('editing');
      setEditBuffer(toSave);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      showMsg('Erro ao salvar: ' + msg, true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('Remover esta matéria?')) return;
    setSaving(true);
    try {
      await deleteArticle(slug);
      await loadArticles();
      if (originalSlug === slug) {
        setMode('idle');
        setEditBuffer(null);
        setOriginalSlug(null);
      }
      showMsg('Matéria removida.');
    } catch {
      showMsg('Erro ao remover.', true);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setMode('idle');
    setEditBuffer(null);
    setOriginalSlug(null);
    setMessage('');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Lista */}
      <aside className="card-border p-4">
        <button onClick={handleNew} disabled={saving}
          className="mb-4 w-full bg-gold px-4 py-2 font-semibold text-ink hover:bg-amber-400 disabled:opacity-50">
          + Nova notícia
        </button>
        {loading ? (
          <p className="text-sm text-zinc-400">Carregando...</p>
        ) : news.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhuma notícia ainda.</p>
        ) : (
          <div className="space-y-2">
            {news.map((a) => (
              <div key={a.slug} className={`rounded border p-3 ${
                originalSlug === a.slug ? 'border-gold/60 bg-zinc-800' : 'border-zinc-800'
              }`}>
                <button className="w-full text-left" onClick={() => handleSelect(a)}>
                  <p className="font-semibold text-zinc-100 text-sm">{a.title || '(sem título)'}</p>
                  <p className="text-xs text-zinc-500">{categoryLabels[a.category]}</p>
                  {a.date && <p className="text-xs text-zinc-600 mt-0.5">{a.date}</p>}
                </button>
                <button onClick={() => handleDelete(a.slug)} disabled={saving}
                  className="mt-1 text-xs text-rose-400 hover:text-rose-300 disabled:opacity-50">
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Formulário */}
      <section className="card-border p-6">
        {mode === 'idle' || !editBuffer ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <p className="text-zinc-400">Selecione uma notícia ou crie uma nova.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-widest text-gold">
              {mode === 'creating' ? '+ Nova matéria' : 'Editando matéria'}
            </p>

            {/* Data automática (somente leitura) */}
            {mode === 'creating' ? (
              <div className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
                Data e horário serão registrados automaticamente ao publicar.
              </div>
            ) : editBuffer.date ? (
              <div className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
                Publicado em: <span className="text-zinc-200">{editBuffer.date}</span>
              </div>
            ) : null}

            {/* Campos básicos (sem data) */}
            <div className="grid gap-4 md:grid-cols-2">
              {([
                ['title', 'Título', 'text', 'Título da matéria'],
                ['subtitle', 'Subtítulo', 'text', 'Subtítulo'],
                ['author', 'Autor', 'text', 'Nome do autor'],
                ['readingTime', 'Tempo de leitura', 'text', 'ex: 5 min'],
              ] as const).map(([field, label, type, placeholder]) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">{label}</label>
                  <input
                    type={type}
                    value={String(editBuffer[field] ?? '')}
                    onChange={(e) => updateField(field, e.target.value as never)}
                    className="rounded bg-zinc-900 p-3 text-zinc-100 outline-none focus:ring-1 focus:ring-gold"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Categoria</label>
                <select value={editBuffer.category}
                  onChange={(e) => updateField('category', e.target.value as EditableArticle['category'])}
                  className="rounded bg-zinc-900 p-3 text-zinc-100 outline-none focus:ring-1 focus:ring-gold">
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Destaque */}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={editBuffer.featured ?? false}
                onChange={(e) => updateField('featured', e.target.checked)} />
              Marcar como matéria em destaque
            </label>

            {/* Imagem de capa */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500">Imagem de capa</label>
              <div className="rounded border border-zinc-700 p-4 space-y-3">
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Enviar arquivo do computador:</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="text-sm text-zinc-300 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-1.5 file:text-xs file:text-zinc-200 hover:file:bg-zinc-600 disabled:opacity-50"
                  />
                  {uploading && <p className="mt-1 text-xs text-amber-400 animate-pulse">Enviando...</p>}
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Ou cole uma URL:</p>
                  <input
                    value={editBuffer.coverImage}
                    onChange={(e) => updateField('coverImage', e.target.value)}
                    className="w-full rounded bg-zinc-900 p-2 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-gold"
                    placeholder="https://..."
                  />
                </div>
                {editBuffer.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editBuffer.coverImage} alt="Preview da capa"
                    className="w-full rounded border border-zinc-700" style={{ aspectRatio: '16/9', objectFit: 'contain', background: '#18181b' }} />
                ) : (
                  <div className="h-20 w-full rounded border border-dashed border-zinc-700 flex items-center justify-center">
                    <span className="text-xs text-zinc-600">Sem imagem</span>
                  </div>
                )}
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">
                Conteúdo — pressione <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-xs">Enter</kbd> duas vezes para novo parágrafo
              </label>
              <textarea
                value={rawContent}
                onChange={handleContentChange}
                className="h-72 w-full rounded bg-zinc-900 p-4 text-zinc-100 leading-relaxed outline-none focus:ring-1 focus:ring-gold resize-y"
                placeholder={`Escreva o primeiro parágrafo aqui...\n\nDê Enter duas vezes para começar um novo parágrafo.`}
              />
              <p className="text-xs text-zinc-600">{editBuffer.content.filter(Boolean).length} parágrafo(s)</p>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button onClick={handleSave} disabled={saving || uploading}
                className="bg-gold px-6 py-2.5 font-semibold text-ink hover:bg-amber-400 disabled:opacity-50 rounded">
                {saving ? 'Salvando...' : mode === 'creating' ? 'Publicar matéria' : 'Salvar alterações'}
              </button>
              <button onClick={handleCancel} disabled={saving}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50">
                Cancelar
              </button>
              {message && (
                <span className={`text-sm ${isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {message}
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
