/**
 * Full-page skeleton shown while company data is loading.
 */
export default function CompanyProfileSkeleton() {
  return (
    <div className="company-profile-page">
      <div className="company-header">
        <div className="company-logo-box" />
        <div style={{ flex: 1 }}>
          <div className="booking-skeleton" style={{ marginBottom: 12 }}>
            <div className="sk-line sk-wide" />
            <div className="sk-line sk-medium" />
          </div>
        </div>
      </div>
    </div>
  );
}