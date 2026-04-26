'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import getCompanies from '@/libs/getCompanies';
import createCompany from '@/libs/createCompany';
import updateCompany from '@/libs/updateCompany';
import deleteCompany from '@/libs/deleteCompany';
import { CompanyItem, CompanyFormData } from '../../../../../interface';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import ModalWrapper from '@/components/ModalWrapper';
import ConfirmModal from '@/components/modals/ConfirmModal';
import '@/styles/admin.css';
import '@/styles/book-company.css';


const emptyForm: CompanyFormData = {
  name: '', address: '', website: '', description: '', telephone_number: '',imgSrc:''
};

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const { toast, showToast }      = useToast();

  // Form modal
  const [formMode, setFormMode]           = useState<'create' | 'edit' | null>(null);
  const [formData, setFormData]           = useState<CompanyFormData>(emptyForm);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget]       = useState<CompanyItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchCompanies = useCallback(async () => {
    const token = localStorage.getItem('jf_token');
    if (!token) return;
    try {
      const res = await getCompanies(token);
       console.log(res.data);
      setCompanies(res.data);
    } catch {
      showToast('Failed to load companies', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

//--ImageHandle
  function CompanyLogo({ src, name }: { src?: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  if (!src || imgError) return <span>🏢</span>;
  return (
    <img
      src={src}
      alt={name}
      className="company-img"
      onError={() => setImgError(true)}
    />
  );
}

  // ── Open modals
  function openCreate() {
    setFormMode('create');
    setFormData(emptyForm);
    setEditingId(null);
  }
  function openEdit(c: CompanyItem) {
    setFormMode('edit');
    setEditingId(c._id);
    setFormData({
      name: c.name,
      address: c.address || '',
      website: c.website || '',
      description: c.description || '',
      telephone_number: c.telephone_number || '',
      imgSrc: c.imgSrc || ''
    });
  }
  function closeForm() {
    setFormMode(null);
    setFormData(emptyForm);
    setEditingId(null);
  }

  function handleFormChange(field: keyof CompanyFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // ── Submit create/edit
  async function handleFormSubmit() {
    if (!formData.name.trim()) return;
    setFormSubmitting(true);
    const token = localStorage.getItem('jf_token')!;
    try {
      if (formMode === 'create') {
        await createCompany(token, formData);
        showToast('Company created', 'success');
      } else if (formMode === 'edit' && editingId) {
        await updateCompany(token, editingId, formData);
        showToast('Company updated', 'success');
      }
      closeForm();
      fetchCompanies();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Operation failed', 'error');
    } finally {
      setFormSubmitting(false);
    }
  }

  // ── Delete
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    const token = localStorage.getItem('jf_token')!;
    try {
      await deleteCompany(token, deleteTarget._id);
      showToast('Company deleted', 'success');
      setDeleteTarget(null);
      fetchCompanies();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Manage Companies</h1>
          <p className="admin-sub">Create, edit, and remove companies</p>
        </div>
        <div className="admin-nav-links">
          <Link href="/admin/dashboard" className="btn-primary" style={{ background: 'none', color: 'var(--text)', border: '1.5px solid var(--border)' }}>
            ← Dashboard
          </Link>
          <button className="btn-primary" onClick={openCreate}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Company
          </button>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search companies…"
      />

      {/* Companies grid */}
      {loading ? (
        <div className="companies-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="sk-company" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🏢"
          title={search ? 'No matching companies' : 'No companies yet'}
          message={search ? 'Try a different search term' : 'Add your first company to get started'}
          action={!search ? <button className="btn-primary" onClick={openCreate}>Add Company</button> : undefined}
        />
      ) : (
        <div className="companies-grid">
          {filtered.map((c, i) => (
            <div key={c._id} className="company-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="company-top">
                <div className="company-logo">
                  <CompanyLogo src={c.imgSrc} name={c.name} />
                    </div>
                <div>
                  <div className="company-name">{c.name}</div>
                  {c.address && <div className="company-sub">{c.address}</div>}
                </div>
              </div>
              {c.description && <div className="company-desc">{c.description}</div>}
              <div className="admin-card-footer">
                <div className="admin-card-meta">
                  {c.telephone_number && <span className="meta-tag">📞 {c.telephone_number}</span>}
                  {c.website && <span className="meta-tag">🌐 {c.website}</span>}
                </div>
                <div className="admin-card-actions">
                  <button className="btn-admin-edit" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn-admin-delete" onClick={() => setDeleteTarget(c)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <ModalWrapper open={!!formMode} onClose={closeForm} className="admin-form-modal">
        <div className="modal-icon">{formMode === 'create' ? '➕' : '✏️'}</div>
        <h3>{formMode === 'create' ? 'New Company' : 'Edit Company'}</h3>

          <div className="admin-form">
            <label className="admin-label">
              Name *
              <input
                className="admin-input"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Company name"
              />
            </label>
            <label className="admin-label">
              Address
              <input
                className="admin-input"
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder="Company address"
              />
            </label>
            <label className="admin-label">
              Description
              <textarea
                className="admin-input admin-textarea"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Brief description"
                rows={3}
              />
            </label>
            <div className="admin-form-row">
              <label className="admin-label">
                Phone
                <input
                  className="admin-input"
                  value={formData.telephone_number}
                  onChange={(e) => handleFormChange('telephone_number', e.target.value)}
                  placeholder="000-000-0000"
                />
              </label>
              <label className="admin-label">
                Website
                <input
                  className="admin-input"
                  value={formData.website}
                  onChange={(e) => handleFormChange('website', e.target.value)}
                  placeholder="https://…"
                />
              </label>
            </div>
            <label className="admin-label">
                Image URL
                <input className="admin-input"
                value={formData.imgSrc}
                onChange={(e) => handleFormChange('imgSrc', e.target.value)}
                placeholder="Logo image"/>
            </label>
          </div>

          <div className="modal-actions" style={{ marginTop: 20 }}>
            <button className="btn-modal-cancel" onClick={closeForm}>Cancel</button>
            <button
              className="btn-modal-confirm"
              style={{ background: 'var(--text)' }}
              disabled={formSubmitting || !formData.name.trim()}
              onClick={handleFormSubmit}
            >
              {formSubmitting ? 'Saving…' : formMode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
      </ModalWrapper>

      {/* Delete Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Company"
        message={<>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will also remove all associated bookings.</>}
        confirmText="Delete"
        loadingText="Deleting…"
        loading={deleteSubmitting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}
