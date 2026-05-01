'use client';

import { useEffect, useMemo, useState } from 'react';
import { categoryLabels } from '@/data/news';
import {
  ADMIN_STORAGE_KEY,
  categories,
  emptyArticle,
  getDefaultArticles,
  parseArticleBody,
  stringifyArticleBody,
  type EditableArticle
} from '@/lib/admin-news';

export function AdminNewsManager() {
  const [news, setNews] = useState<EditableArticle[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) {
      setNews(JSON.parse(saved));
      return;
    }
    setNews(getDefaultArticles());
  }, []);

  useEffect(() => {
    if (news.length > 0) {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(news));
    }
  }, [news]);

  const selected = useMemo(() => news.find((article) => article.slug === selectedSlug) ?? emptyArticle(), [news, selectedSlug]);

  function handleCreate() {
    const draft = {
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
    setNews((prev) => [draft, ...prev]);
    setSelectedSlug(draft.slug);
    setMessage('Matéria criada com sucesso.');
  }

  function handleDelete(slug: string) {
    setNews((prev) => prev.filter((item) => item.slug !== slug));
    setSelectedSlug(null);
    setMessage('Matéria removida.');
  }

  function handleSave() {
    if (!selectedSlug) return;
    setNews((prev) => prev.map((item) => (item.slug === selectedSlug ? selected : item)));
    setMessage('Alterações salvas localmente.');
  }

  function updateField<K extends keyof EditableArticle>(field: K, value: EditableArticle[K]) {
    if (!selectedSlug) return;
    setNews((prev) => prev.map((item) => (item.slug === selectedSlug ? { ...item, [field]: value } : item)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="card-border p-4">
        <button onClick={handleCreate} className="mb-4 w-full bg-gold px-4 py-2 font-semibold text-ink hover:bg-amber-400">+ Nova notícia</button>
        <div className="space-y-2">
          {news.map((article) => (
            <div key={article.slug} className="rounded border border-zinc-800 p-3">
              <button className="text-left" onClick={() => setSelectedSlug(article.slug)}>
                <p className="font-semibold text-zinc-100">{article.title}</p>
                <p className="text-xs text-zinc-500">{categoryLabels[article.category]}</p>
              </button>
              <button onClick={() => handleDelete(article.slug)} className="mt-2 text-xs text-rose-300 hover:text-rose-200">Remover</button>
            </div>
          ))}
        </div>
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
            <input value={selected.coverImage} onChange={(e) => updateField('coverImage', e.target.value)} className="w-full bg-zinc-900 p-3" placeholder="URL da capa" />
            <textarea
              value={stringifyArticleBody(selected.content)}
              onChange={(e) => updateField('content', parseArticleBody(e.target.value))}
              className="h-64 w-full bg-zinc-900 p-3"
              placeholder="Corpo da matéria (separe parágrafos com linha em branco)"
            />
            <div className="flex items-center gap-3">
              <button onClick={handleSave} className="bg-gold px-5 py-2 font-semibold text-ink hover:bg-amber-400">Salvar alterações</button>
              <span className="text-sm text-zinc-400">{message}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
