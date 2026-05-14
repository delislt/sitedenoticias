'use client';

import { useEffect, useState, useCallback } from 'react';
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
} from '@/lib/supabase-articles';

type Mode = 'idle' | 'creating' | 'editing';

export function AdminNewsManager() {
  const [news, setNews] = useState<EditableArticle[]>([]);
  const [mode, setMode] = useState<Mode>('idle');
  const [editBuffer, setEditBuffer] = useState<EditableArticle | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const articles = await fetchAllArticles();
      setNews(articles);
    } catch {
      setMessage('Erro ao carregar notícias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  function handleNew() {
    const draft: EditableArticle = {
      ...emptyArticle(),
      slug: `nova-materia-${Date.now()}`,
      title: 'Nova matéria SIS',
      subtitle: 'Subtítulo da nova matéria',
      author: 'Equipe SIS',
      date: new Date().toLocaleDateString('pt-BR'),
      readingTime: '4 min',
      coverImage: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
      content: ['Escreva aqui o primeiro parágrafo da matéria.']
    };
    setEditBuffer(draft);
    setOriginalSlug(null);
    setMode('creating');
    setMessage('');
  }

  function handleSelect(article: EditableArticle) {
    setEditBuffer({ ...article });
    setOriginalSlug(article.slug);
    setMode('editing');
    setMessage('');
  }

  function updateField<K extends keyof EditableArticle>(field: K, value: EditableArticle[K]) {
    setEditBuffer((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function handleSave() {
    if (!editBuffer) return;
    setSaving(true);
    setMessage('');
    try {
      if (mode === 'creating') {
        await createArticle(editBuffer);
        setMessage('Matéria criada com sucesso!');
      } else if (mode === 'editing' && originalSlug) {
        await updateArticle(originalSlug, editBuffer);
        setMessage('Alterações salvas com sucesso!');
      }
      await loadArticles();
      setOriginalSlug(editBuffer.slug);
      setMode('editing');
    } catch {
      setMessage('Erro ao salvar. Verifique os campos e tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('Tem certeza que deseja remover esta matéria?')) return;
    setSaving(true);
    try {
      await deleteArticle(slug);
      await loadArticles();
      if (originalSlug === slug) {
        setMode('idle');
        setEditBuffer(null);
        setOriginalSlug(null);
      }
      setMessage('Matéria removida.');
    } catch {
      setMessage('Erro ao remover matéria.');
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
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Lista lateral */}
      <aside className="card-border p-4">
        <button
          onClick={handleNew}
          disabled={saving}
          className="mb-4 w-full bg-gold px-4 py-2 font-semibold text-ink hover:bg-amber-400 disabled:opacity-50"
        >
          + Nova notícia
        </button>
        {loading ? (
          <p className="text-sm text-zinc-400">Carregando...</p>
        ) : news.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhuma notícia cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {news.map((article) => (
              <div
                key={article.slug}
                className={`rounded border p-3 ${
                  originalSlug === article.slug
                    ? 'border-gold/60 bg-zinc-800'
                    : 'border-zinc-800'
                }`}
              >
                <button className="w-full text-left" onClick={() => handleSelect(article)}>
                  <p className="font-semibold text-zinc-100">{article.title}</p>
                  <p className="text-xs text-zinc-500">{categoryLabels[article.category]}</p>
                </button>
                <button
                  onClick={() => handleDelete(article.slug)}
                  disabled={saving}
                  className="mt-2 text-xs text-rose-300 hover:text-rose-200 disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Formulário de edição */}
      <section className="card-border p-6">
        {mode === 'idle' || !editBuffer ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-zinc-400">Selecione uma notícia para editar</p>
            <p className="text-zinc-600">ou clique em <strong className="text-zinc-300">+ Nova notícia</strong> para criar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-gold">
              {mode === 'creating' ? 'Nova matéria' : 'Editando matéria'}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Título</label>
                <input
                  value={editBuffer.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="bg-zinc-900 p-3 text-zinc-100"
                  placeholder="Título da matéria"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Subtítulo</label>
                <input
                  value={editBuffer.subtitle}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                  className="bg-zinc-900 p-3 text-zinc-100"
                  placeholder="Subtítulo"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Autor</label>
                <input
                  value={editBuffer.author}
                  onChange={(e) => updateField('author', e.target.value)}
                  className="bg-zinc-900 p-3 text-zinc-100"
                  placeholder="Nome do autor"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Data (ex: 14/05/2026)</label>
                <input
                  value={editBuffer.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="bg-zinc-900 p-3 text-zinc-100"
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Tempo de leitura</label>
                <input
                  value={editBuffer.readingTime}
                  onChange={(e) => updateField('readingTime', e.target.value)}
                  className="bg-zinc-900 p-3 text-zinc-100"
                  placeholder="ex: 5 min"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Categoria</label>
                <select
                  value={editBuffer.category}
                  onChange={(e) => updateField('category', e.target.value as EditableArticle['category'])}
                  className="bg-zinc-900 p-3 text-zinc-100"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={editBuffer.featured ?? false}
                  onChange={(e) => updateField('featured', e.target.checked)}
                />
                Matéria em destaque
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">URL da imagem de capa</label>
              <input
                value={editBuffer.coverImage}
                onChange={(e) => updateField('coverImage', e.target.value)}
                className="w-full bg-zinc-900 p-3 text-zinc-100"
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Conteúdo (separe parágrafos com linha em branco)</label>
              <textarea
                value={stringifyArticleBody(editBuffer.content)}
                onChange={(e) => updateField('content', parseArticleBody(e.target.value))}
                className="h-64 w-full bg-zinc-900 p-3 text-zinc-100"
                placeholder="Primeiro parágrafo...&#10;&#10;Segundo parágrafo..."
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gold px-5 py-2 font-semibold text-ink hover:bg-amber-400 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : mode === 'creating' ? 'Publicar matéria' : 'Salvar alterações'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              {message && (
                <span className={`text-sm ${
                  message.includes('Erro') ? 'text-rose-400' : 'text-emerald-400'
                }`}>
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
