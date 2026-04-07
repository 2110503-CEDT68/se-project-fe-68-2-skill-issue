'use client';

import { BookingItem } from '../../../interface';
import { formatDate } from '../../utils/dateFormat';
import ModalWrapper from '../ModalWrapper';

interface DetailModalProps {
  target:  BookingItem;
  onClose: () => void;
}

export default function DetailModal({ target, onClose }: DetailModalProps) {
  const company = target.company;
  const website = company?.website || '';
  const websiteHref = website
    ? website.startsWith('http') ? website : `https://${website}`
    : null;

  return (
    <ModalWrapper open onClose={onClose} className="detail-modal">

        <div className="detail-header">
          <div className="detail-icon-box">🏢</div>
          <div>
            <div className="detail-company-name">{company?.name}</div>
            <div className="detail-company-addr">{company?.address}</div>
          </div>
        </div>

        <div className="detail-body">
          {company?.description && (
            <div className="detail-row">
              <span className="detail-emoji">📝</span>
              <div>
                <div className="detail-label">About</div>
                <div className="detail-val">{company.description}</div>
              </div>
            </div>
          )}
          {company?.telephone_number && (
            <div className="detail-row">
              <span className="detail-emoji">📞</span>
              <div>
                <div className="detail-label">Tel.</div>
                <div className="detail-val">{company.telephone_number}</div>
              </div>
            </div>
          )}
          {websiteHref && (
            <div className="detail-row">
              <span className="detail-emoji">🌐</span>
              <div>
                <div className="detail-label">Website</div>
                <div className="detail-val">
                  <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                    {website}
                  </a>
                </div>
              </div>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-emoji">📅</span>
            <div>
              <div className="detail-label">Booked Date</div>
              <div className="detail-val">
                <strong>{formatDate(target.bookingDate)}</strong>
              </div>
            </div>
          </div>
        </div>

        <button className="btn-modal-cancel"
          style={{ width: '100%', padding: '11px' }}
          onClick={onClose}>
          Close
        </button>
    </ModalWrapper>
  );
}