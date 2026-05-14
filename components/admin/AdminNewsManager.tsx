'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
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

export function AdminNewsManager() {
  const [news, setNews] = useState<EditableArticle[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<EditableArticle | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const articles = await fetchAllArticles();
      setNews(articles);
    } catch (e) {
      setMessage('Erro ao carregar notícias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const selected = useMemo(
    () => editBuffer ?? news.find((a) => a.slug === selectedSlug) ?? emptyArticle(),
    [editBuffer, news, selectedSlug]
  );

  function handleSelect(slug: string) {
    setSelectedSlug(slug);
    setEditBuffer(news.find((a) => a.slug === slug) ?? null);
    setMessage('');
  }

  function updateField<K extends keyof EditableArticle>(field: K, value: EditableArticle[K]) {
    setEditBuffer((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function handleCreate() {
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
    setSaving(true);
    try {
      await createArticle(draft);
      await loadArticles();
      setSelectedSlug(draft.slug);
      setEditBuffer(draft);
      setMessage('Matéria criada com sucesso.');
    } catch (e) {
      setMessage('Erro ao criar matéria.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    setSaving(true);
    try {
      await deleteArticle(slug);
      await loadArticles();
      setSelectedSlug(null);
      setEditBuffer(null);
      setMessage('Matéria removida.');
    } catch (e) {
      setMessage('Erro ao remover matéria.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!selectedSlug || !editBuffer) return;
    setSaving(true);
    try {
      await updateArticle(selectedSlug, editBuffer);
      await loadArticles();
      setMessage('Alterações salvas com sucesso.');
    } catch (e) {
      setMessage('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="card-border p-4">
        <button
          onClick={handleCreate}
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
              <div key={article.slug} className="rounded border border-zinc-800 p-3">
                <button className="text-left" onClick={() => handleSelect(article.slug)}>
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

      <section className="card-border p-6">
        {!selectedSlug ? (
          <p className="text-zinc-400">Selecione uma notícia para editar ou crie uma nova.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input value={selected.title} onChange={(e) => updateField('title', e.target.value)} className="bg-zinc-900 p-3" placeholder="Título" />
              <input value={selected.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} className="bg-zinc-900 p-3" placeholder="Subtítulo" />
              <input value={selected.author} onChange={(e) => updateField('author', e.target.value)} className="bg-zinc-900 p-3" placeholder="Autor" />
              <input value={selected.date} onChange={(e) => updateField('date', e.target.value)} className="bg-zinc-900 p-3" placeholder="Data" />
              <input value={selected.readingTime} onChange={(e) => updateField('readingTime', e.target.value)} className="bg-zinc-900 p-3" placeholder="Tempo de leitura" />
              <select value={selected.category} onChange={(e) => updateField('category', e.target.value as EditableArticle['category'])} className="bg-zinc-900 p-3">
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={selected.featured ?? false}
                  onChange={(e) => updateField('featured', e.target.checked)}
                />
                Destaque
              </label>
            </div>
            <input value={selected.coverImage} onChange={(e) => updateField('coverImage', e.target.value)} className="w-full bg-zinc-900 p-3" placeholder="URL da capa" />
            <textarea
              value={stringifyArticleBody(selected.content)}
              onChange={(e) => updateField('content', parseArticleBody(e.target.value))}
              className="h-64 w-full bg-zinc-900 p-3"
              placeholder="Corpo da matéria (separe parágrafos com linha em branco)"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gold px-5 py-2 font-semibold text-ink hover:bg-amber-400 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <span className="text-sm text-zinc-400">{message}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
