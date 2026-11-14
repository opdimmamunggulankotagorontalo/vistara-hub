import { useEffect, useState } from 'react';
import { Plus, Trash2, Lock, Unlock, X } from 'lucide-react';
import type { PollingTopic } from '../../../types';
import {
  clearAllPolls,
  createPoll,
  deletePoll,
  fetchPolls,
  subscribeToTableChanges,
  updatePollStatus,
} from '../../../services/dataClient';
import { EmptyState, LoadingState } from '../../../components/ui';

export default function PollingPanel() {
  const [polls, setPolls] = useState<PollingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Kegiatan Siswa');
  const [closesAt, setClosesAt] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const loadPolls = async () => {
    const items = await fetchPolls();
    setPolls(items);
  };

  useEffect(() => {
    let active = true;
    fetchPolls()
      .then((items) => {
        if (active) setPolls(items);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsub = subscribeToTableChanges(['polling_topics', 'polling_options'], () => {
      if (active) void loadPolls();
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedOptions = optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!question.trim() || !closesAt.trim() || parsedOptions.length < 2) {
      setError('Pertanyaan, tanggal tutup, dan minimal 2 baris opsi jawaban wajib diisi.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const updated = await createPoll({
        question: question.trim(),
        description: description.trim() || question.trim(),
        category: category.trim(),
        closesAt: closesAt.trim(),
        options: parsedOptions,
      });
      setPolls(updated);
      setQuestion('');
      setDescription('');
      setClosesAt('');
      setOptionsText('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat polling.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (poll: PollingTopic) => {
    const nextStatus = poll.status === 'active' ? 'closed' : 'active';
    const updated = await updatePollStatus(poll.id, nextStatus);
    setPolls(updated);
  };

  const handleDelete = async (pollId: string) => {
    const updated = await deletePoll(pollId);
    setPolls(updated);
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      await clearAllPolls();
      setPolls([]);
      setConfirmClearAll(false);
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--mid-grey)' }}>
          Kelola topik jajak pendapat siswa real-time.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {polls.length > 0 && (
            confirmClearAll ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  disabled={isClearingAll}
                  onClick={handleClearAll}
                  style={{
                    minHeight: '42px',
                    padding: '0 0.85rem',
                    borderRadius: '9px',
                    border: 'none',
                    background: '#C62828',
                    color: 'white',
                    fontFamily: 'var(--font-header)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isClearingAll ? 'Menghapus...' : 'Ya, Hapus Semua'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="btn btn-outline btn-sm"
                  style={{ minHeight: '42px' }}
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                style={{
                  minHeight: '42px',
                  padding: '0 0.85rem',
                  borderRadius: '9px',
                  border: '1px solid #FFCDD2',
                  background: '#FFF5F5',
                  color: '#C62828',
                  fontFamily: 'var(--font-header)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} /> Kosongkan Semua
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="btn btn-primary btn-sm"
            style={{ minHeight: '42px' }}
          >
            {showForm ? <><X size={15} /> Tutup Form</> : <><Plus size={15} /> Buat Polling Baru</>}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="admin-surface"
          style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
        >
          <h3 style={{ fontSize: '1rem', color: 'var(--deep-violet)', margin: 0 }}>
            Topik Polling Baru
          </h3>

          {error && (
            <div style={{ fontSize: '0.82rem', color: '#C62828', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Pertanyaan Polling *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Tema apa yang paling diminati untuk Workshop Bulan Depan?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
            />
          </div>

          <div className="admin-form-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Kategori
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
                Batas Akhir Polling *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 30 November 2026"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Deskripsi Singkat
            </label>
            <input
              type="text"
              placeholder="Penjelasan tujuan polling bagi siswa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', minHeight: '44px', padding: '0.55rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--deep-violet)', marginBottom: '0.3rem' }}>
              Opsi Pilihan (Satu opsi per baris, minimal 2) *
            </label>
            <textarea
              rows={4}
              required
              placeholder={'Opsi 1\nOpsi 2\nOpsi 3'}
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '9px', border: '1px solid #D4BFEF', fontSize: '0.88rem', lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-sm" style={{ minHeight: '44px' }}>
              {isSubmitting ? 'Menerbitkan...' : 'Terbitkan Polling'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingState />
      ) : polls.length === 0 ? (
        <EmptyState
          title="Belum ada polling siswa"
          description="Klik tombol 'Buat Polling Baru' untuk memulai jajak pendapat bersama siswa."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {polls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
            const isActive = poll.status === 'active';
            return (
              <div
                key={poll.id}
                className="admin-surface"
                style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                    <div className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--mid-grey)', fontFamily: 'var(--font-header)', marginBottom: '0.2rem' }}>
                      {poll.category} · Tutup {poll.closesAt} · <strong style={{ color: 'var(--deep-violet)' }}>{totalVotes} suara</strong>
                    </div>
                    <h3 style={{ fontSize: '0.98rem', color: 'var(--deep-violet)', margin: 0 }}>{poll.question}</h3>
                  </div>

                  <span
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: isActive ? '#E8F5E9' : '#F3F0F8',
                      color: isActive ? '#2E7D32' : 'var(--mid-grey)',
                    }}
                  >
                    {isActive ? 'Aktif' : 'Ditutup'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {poll.options.map((opt) => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem', padding: '0.45rem 0.7rem', borderRadius: '8px', background: '#FAF8FF', border: '1px solid #EDE6F8' }}>
                        <span style={{ color: 'var(--charcoal)', fontWeight: 500 }}>{opt.label}</span>
                        <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--vistara-purple)', flexShrink: 0, marginLeft: '0.5rem' }}>
                          {pct}% ({opt.votes})
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(poll)}
                    className="btn btn-outline btn-sm"
                    style={{ minHeight: '40px' }}
                  >
                    {isActive ? <><Lock size={14} /> Tutup Polling</> : <><Unlock size={14} /> Buka Kembali</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(poll.id)}
                    style={{
                      minHeight: '40px',
                      padding: '0 0.75rem',
                      borderRadius: '9px',
                      border: '1px solid #FFCDD2',
                      background: '#FFF5F5',
                      color: '#C62828',
                      fontFamily: 'var(--font-header)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
