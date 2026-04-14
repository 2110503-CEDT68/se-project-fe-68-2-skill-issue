'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import CompanyCard from '@/components/CompanyCard';
import SearchBar   from '@/components/SearchBar';
import BookModal   from '@/components/modals/BookModal';
import CancelModal from '@/components/modals/CancelModal';
import EmptyState  from '@/components/EmptyState';
import Toast       from '@/components/Toast';

import { useBookCompany } from '@/hooks/useBookCompany';

import '@/styles/book-company.css';

export default function BookCompanyPage() {
  const {
    filtered, bookingMap, loading, error,
    search, setSearch, toast, isFull,
    selected, setSelected,
    editMode,
    bookDate, setBookDate,
    bookTime, setBookTime,
    submitting,
    cancelTarget, setCancelTarget,
    cancelling,
    loadData,
    openBookModal,
    openEditModal,
    confirmBooking,
    confirmCancel,
    companies,
  } = useBookCompany();

  return (
    <div className="container">
      <div className="page-header">
        <h1>Book a Company</h1>
        <p>{loading ? 'Loading...' : `${companies.length} companies participating`}</p>
      </div>

      <div className="info-banner">
        Booking dates must be between <strong>May 10–13, 2022</strong>.
        Each user may book up to <strong>3 companies</strong>.
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search company name or description..."
      />

      {loading ? (
        <div className="companies-grid">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="skeleton sk-company" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Could not load companies"
          message={error}
          action={<button className="btn-primary" onClick={loadData}>Retry</button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No companies found"
          message="Try a different search term."
        />
      ) : (
        <div className="companies-grid">
          {filtered.map((company, i) => (
            <CompanyCard
              key={company._id}
              company={company}
              booked={bookingMap[company._id]}
              isFull={isFull}
              index={i}
              onBook={openBookModal}
              onEdit={openEditModal}
              onCancel={(b) => setCancelTarget(b)}
            />
          ))}
        </div>
      )}

      {selected && (
        <BookModal
          company={selected}
          editMode={editMode}
          date={bookDate} time={bookTime}
          submitting={submitting}
          onDateChange={setBookDate} onTimeChange={setBookTime}
          onConfirm={confirmBooking}
          onClose={() => setSelected(null)}
        />
      )}

      {cancelTarget && (
        <CancelModal
          target={cancelTarget}
          loading={cancelling}
          onConfirm={confirmCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}