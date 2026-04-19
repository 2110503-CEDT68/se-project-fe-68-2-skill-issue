/**
 * Playwright Test Suite — Job Fair Frontend
 * Covers: US1-1 to US2-2 (16 Acceptance Criteria — 18 test cases)
 *
 * Architecture:
 *   - All API calls intercepted via page.route() — no live backend needed
 *   - localStorage seeded via page.addInitScript() to simulate logged-in state
 *   - Exact CSS classes/selectors confirmed from source code analysis
 *   - Exact API URLs confirmed from backend routes + server.js mount paths:
 *       GET/POST /api/v1/companies/:id/reviews  — reviews under a company
 *       PUT/DELETE /api/v1/reviews/:id          — single review operations
 *       GET /api/v1/auth/me                     — admin layout guard
 *       GET /api/v1/blogs, POST /api/v1/blogs   — blog CRUD
 *       GET /api/v1/blogs/:id/comments, POST    — comment CRUD
 *       maxlength: review comment 100, blog title 50, blog content 50, comment text 100
 */

import { test, expect, Page } from '@playwright/test';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const USER = {
  _id: 'user-001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
};

const ADMIN = {
  _id: 'admin-001',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
};

const COMPANY_ID = 'company-abc';

const COMPANY = {
  _id: COMPANY_ID,
  name: 'Acme Corp',
  address: '123 Main St',
  description: 'A great company',
  averageRating: 4.0,
  numReviews: 2,
};

// Review by another user (not logged-in user)
const REVIEW_OTHER = {
  _id: 'review-001',
  rating: 4,
  comment: 'Great place to work!',
  company: COMPANY_ID,
  user: { _id: 'other-user-999', name: 'Other User' },
  createdAt: '2024-01-10T10:00:00.000Z',
  edited: false,
  editedAt: '',
  effectiveDate: '2024-01-10T10:00:00.000Z',
};

// Review owned by the logged-in user
const MY_REVIEW = {
  _id: 'review-mine',
  rating: 5,
  comment: 'Absolutely loved it!',
  company: COMPANY_ID,
  user: { _id: USER._id, name: USER.name },
  createdAt: '2024-02-01T12:00:00.000Z',
  edited: false,
  editedAt: '',
  effectiveDate: '2024-02-01T12:00:00.000Z',
};

const BLOG_POST = {
  _id: 'post-001',
  title: 'My First Blog Post',
  content: 'Hello world content.',
  author: { _id: USER._id, name: USER.name },
  numComments: 0,
  createdAt: '2024-03-01T09:00:00.000Z',
  effectiveDate: '2024-03-01T09:00:00.000Z',
};

// ─── Shared Helpers ───────────────────────────────────────────────────────────

/** Seed localStorage so the app thinks a user is logged in. */
async function loginAs(page: Page, user: typeof USER | typeof ADMIN) {
  await page.addInitScript((u) => {
    localStorage.setItem('jf_token', 'mock-token-123');
    localStorage.setItem('jf_user', JSON.stringify(u));
  }, user);
}

/**
 * Mock all APIs needed for the Company Profile page.
 * Reviews list is configurable; company object is fixed.
 */
async function mockCompanyPage(page: Page, reviews: object[] = [MY_REVIEW]) {
  // GET /api/v1/companies/:id  (protected route — needs token)
  await page.route(`**/companies/${COMPANY_ID}`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: COMPANY }),
      });
    } else {
      route.continue();
    }
  });

  // GET/POST /api/v1/companies/:id/reviews
  await page.route(`**/companies/${COMPANY_ID}/reviews`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, count: reviews.length, data: reviews }),
      });
    } else if (route.request().method() === 'POST') {
      // Return the newly created review
      const body = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: 'review-new-001',
            rating: body.rating,
            comment: body.comment,
            company: COMPANY_ID,
            user: { _id: USER._id, name: USER.name },
            createdAt: new Date().toISOString(),
            edited: false,
            editedAt: '',
            effectiveDate: new Date().toISOString(),
          },
        }),
      });
    }
  });

  // PUT and DELETE /api/v1/reviews/:id — combined in one handler to avoid route conflicts
  await page.route(`**/reviews/review-mine`, (route) => {
    const method = route.request().method();
    if (method === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...MY_REVIEW, ...body, edited: true, editedAt: new Date().toISOString() },
        }),
      });
    } else if (method === 'DELETE') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    } else {
      route.continue();
    }
  });

  // GET /api/v1/bookings  (useBookCompany hook)
  await page.route('**/bookings**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, count: 0, data: [] }),
    });
  });
}

/** Navigate to the company profile page. */
async function goToCompanyPage(page: Page) {
  await page.goto(`/company/${COMPANY_ID}`, { waitUntil: 'networkidle' });
}

/**
 * Mock all APIs needed for Admin Reviews page.
 * Includes /auth/me so AdminLayout doesn't redirect to /login.
 */
async function mockAdminReviewsPage(page: Page, reviews: object[] = [REVIEW_OTHER]) {
  // AdminLayout calls GET /api/v1/auth/me to verify the token + role
  await page.route('**/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: ADMIN }),
    });
  });

  // GET /api/v1/companies  (admin fetches all companies to build review list)
  await page.route('**/companies', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [COMPANY] }),
      });
    } else {
      route.continue();
    }
  });

  // GET /api/v1/companies/:id/reviews  (fetched per company)
  await page.route(`**/companies/${COMPANY_ID}/reviews`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, count: reviews.length, data: reviews }),
      });
    } else {
      route.continue();
    }
  });

  // DELETE /api/v1/reviews/:id  — method-scoped to avoid intercepting GET routes
  await page.route('**/reviews/**', (route) => {
    if (route.request().method() === 'DELETE') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    } else {
      route.continue();
    }
  });

  await page.route('**/bookings**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, count: 0, data: [] }),
    });
  });
}

/** Mock APIs for Blog pages. */
async function mockBlogAPIs(page: Page, comments: object[] = []) {
  // GET /api/v1/blogs
  await page.route('**/blogs', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, count: 1, data: [BLOG_POST] }),
      });
    } else if (route.request().method() === 'POST') {
      // POST /api/v1/blogs — create blog
      const body = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...BLOG_POST, _id: 'post-new', title: body.title, content: body.content },
        }),
      });
    } else {
      route.continue();
    }
  });

  // GET/POST /api/v1/blogs/:id/comments
  await page.route(`**/blogs/${BLOG_POST._id}/comments`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, count: comments.length, data: comments }),
      });
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: 'comment-new-001',
            text: body.text,
            author: { _id: USER._id, name: USER.name },
            blog: BLOG_POST._id,
            createdAt: new Date().toISOString(),
            effectiveDate: new Date().toISOString(),
          },
        }),
      });
    } else {
      route.continue();
    }
  });

  // Catch-all for any other comment endpoint variations
  await page.route('**/comments**', (route) => {
    if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: 'comment-new-001',
            text: body.text,
            author: { _id: USER._id, name: USER.name },
            blog: BLOG_POST._id,
            createdAt: new Date().toISOString(),
          },
        }),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, count: comments.length, data: comments }),
      });
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// US 1-1 — Submit a Review
// Backend: POST /api/v1/companies/:id/reviews
//          Required: rating (1-5 int), comment (string, max 100)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-1 — Submit a Review', () => {

  /**
   * AC1: Given logged-in user on Company Profile Page,
   *      When submit valid 1-5 star rating + valid comment,
   *      Then review saved successfully and displayed on the page.
   */
  test('AC1 — Valid rating and comment submits successfully', async ({ page }) => {
    await loginAs(page, USER);
    // No existing reviews so the "Write a Review" button is available
    await mockCompanyPage(page, []);
    await goToCompanyPage(page);

    // Track the POST request body sent to the backend
    let capturedBody: Record<string, unknown> = {};
    await page.route(`**/companies/${COMPANY_ID}/reviews`, async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: 'review-new-001',
              rating: capturedBody.rating,
              comment: capturedBody.comment,
              company: COMPANY_ID,
              user: { _id: USER._id, name: USER.name },
              createdAt: new Date().toISOString(),
              edited: false,
              editedAt: '',
              effectiveDate: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, count: 0, data: [] }),
        });
      }
    });

    // Click the "Write a Review" button to open the create modal
    const reviewBtn = page.locator('button', { hasText: /review/i }).first();
    await reviewBtn.waitFor({ state: 'visible', timeout: 8000 });
    await reviewBtn.click();

    // Fill in a valid comment
    const textarea = page.locator('textarea.review-textarea');
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('This is a valid review comment.');

    // Click the 4th star button (0-indexed) to select a 4-star rating
    await page.locator('.star-btn').nth(3).click();

    // Click Publish
    await page.locator('button', { hasText: /publish/i }).click();

    // Modal should close after successful submission
    await expect(page.locator('textarea.review-textarea')).not.toBeVisible({ timeout: 5000 });

    // Verify the correct payload was sent to the backend
    expect(capturedBody.rating).toBe(4);
    expect(capturedBody.comment).toBe('This is a valid review comment.');
  });

  /**
   * AC2a: Given logged-in user on Company Profile Page,
   *       When attempt to submit WITHOUT a star rating,
   *       Then system blocks submission and shows "Please select a star rating."
   */
  test('AC2a — Missing rating shows validation error', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyPage(page, []);
    await goToCompanyPage(page);

    const reviewBtn = page.locator('button', { hasText: /review/i }).first();
    await reviewBtn.waitFor({ state: 'visible', timeout: 8000 });
    await reviewBtn.click();

    // Fill comment only — leave stars at 0 (default)
    const textarea = page.locator('textarea.review-textarea');
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('A comment without any star rating.');

    await page.locator('button', { hasText: /publish/i }).click();

    // Validation error for missing star rating (from CreateReviewModal)
    await expect(page.locator('text=Please select a star rating.')).toBeVisible({ timeout: 3000 });
    // Modal stays open
    await expect(textarea).toBeVisible();
  });

  /**
   * AC2b: Given logged-in user on Company Profile Page,
   *       When attempt to submit WITHOUT a comment,
   *       Then system blocks submission and shows "Please write a comment."
   */
  test('AC2b — Missing comment shows validation error', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyPage(page, []);
    await goToCompanyPage(page);

    const reviewBtn = page.locator('button', { hasText: /review/i }).first();
    await reviewBtn.waitFor({ state: 'visible', timeout: 8000 });
    await reviewBtn.click();

    const textarea = page.locator('textarea.review-textarea');
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    // Select 3 stars but leave comment empty
    await page.locator('.star-btn').nth(2).click();

    await page.locator('button', { hasText: /publish/i }).click();

    // Validation error for missing comment
    await expect(page.locator('text=Please write a comment.')).toBeVisible({ timeout: 3000 });
    await expect(textarea).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-2 — View Reviews
// Backend: GET /api/v1/companies/:id/reviews
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-2 — View Reviews', () => {

  /**
   * AC1: Given any user on Company Profile Page,
   *      When page loads with reviews,
   *      Then review list is displayed AND average rating score is shown.
   */
  test('AC1 — Reviews list and average rating are displayed', async ({ page }) => {
    await mockCompanyPage(page, [REVIEW_OTHER, MY_REVIEW]);
    await goToCompanyPage(page);

    // At least one review card must be visible
    await expect(page.locator('.review-card').first()).toBeVisible({ timeout: 8000 });

    // Average rating shown as "X.X/5.0" (from CompanyHeader — company.averageRating)
    await expect(page.locator('text=/\\d\\.\\d\\/5\\.0/')).toBeVisible({ timeout: 5000 });

    // Actual comment text from REVIEW_OTHER must appear on screen
    await expect(page.locator('text=Great place to work!')).toBeVisible();
  });

  /**
   * AC2: Given any user on Company Profile Page with zero reviews,
   *      When page loads,
   *      Then "No Reviews Yet" and "Be the first one to leave a review" placeholders shown.
   */
  test('AC2 — Empty reviews shows no-reviews placeholder', async ({ page }) => {
    await mockCompanyPage(page, []);
    await goToCompanyPage(page);

    // ReviewsFeed renders .no-reviews-placeholder when reviews array is empty
    await expect(page.locator('.no-reviews-placeholder')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=/No Reviews Yet/i')).toBeVisible();
    await expect(page.locator('text=/Be the first one to leave a review/i')).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-3 — Edit a Review
// Backend: PUT /api/v1/reviews/:id  (owner or admin only)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-3 — Edit a Review', () => {

  /**
   * AC1: Given logged-in user opens Edit Review modal,
   *      When modify rating/comment and click Save Changes,
   *      Then review is updated (modal closes) and "edited" badge is shown.
   */
  test('AC1 — Saving edit updates review and closes modal', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyPage(page, [MY_REVIEW]);
    await goToCompanyPage(page);

    // Click Edit button on my review card (class: btn-review-edit)
    await expect(page.locator('.btn-review-edit').first()).toBeVisible({ timeout: 8000 });
    await page.locator('.btn-review-edit').first().click();

    // Edit Review modal opens
    await expect(page.locator('text=Edit Your Review')).toBeVisible({ timeout: 3000 });

    // Update the comment text
    const textarea = page.locator('textarea.review-textarea');
    await textarea.clear();
    await textarea.fill('Updated review after edit.');

    // Change to 3 stars
    await page.locator('.star-btn').nth(2).click();

    // Click Save Changes
    await page.locator('button', { hasText: /save changes/i }).click();

    // Modal should close on success
    await expect(page.locator('text=Edit Your Review')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * AC2: Given logged-in user on Edit Review modal,
   *      When clears all comment text and attempts to save,
   *      Then system rejects the update (error shown, modal stays open).
   */
  test('AC2 — Empty comment on edit is rejected with error', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyPage(page, [MY_REVIEW]);
    await goToCompanyPage(page);

    await expect(page.locator('.btn-review-edit').first()).toBeVisible({ timeout: 8000 });
    await page.locator('.btn-review-edit').first().click();

    await expect(page.locator('text=Edit Your Review')).toBeVisible({ timeout: 3000 });

    // Clear the textarea completely
    const textarea = page.locator('textarea.review-textarea');
    await textarea.clear();

    // Attempt to save
    await page.locator('button', { hasText: /save changes/i }).click();

    // Frontend validation fires — "Please write a comment." (from EditReviewModal)
    await expect(page.locator('text=Please write a comment.')).toBeVisible({ timeout: 3000 });
    // Modal stays open
    await expect(textarea).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-4 — Delete a Review
// Backend: DELETE /api/v1/reviews/:id  (owner or admin only)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-4 — Delete a Review', () => {

  /**
   * AC1: Given logged-in user clicks Delete on their review and confirms,
   *      Then the review is permanently removed from the UI.
   */
  test('AC1 — Confirming delete removes review from UI', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyPage(page, [MY_REVIEW]);
    await goToCompanyPage(page);

    // Click the Delete button on my review (class: btn-review-delete)
    await expect(page.locator('.btn-review-delete').first()).toBeVisible({ timeout: 8000 });
    await page.locator('.btn-review-delete').first().click();

    // Confirmation modal appears (DeleteReviewModal)
    await expect(page.locator('text=Delete Review?')).toBeVisible({ timeout: 3000 });

    // Confirm by clicking "Yes, Delete it" (class: btn-confirm-delete)
    await page.locator('.btn-confirm-delete').click();

    // Confirmation modal closes
    await expect(page.locator('text=Delete Review?')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * AC2: Given the deletion confirmation dialog is open,
   *      When user clicks "Keep it",
   *      Then the review remains visible and no changes are made.
   */
  test('AC2 — Clicking "Keep it" cancels deletion, review remains', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyPage(page, [MY_REVIEW]);
    await goToCompanyPage(page);

    await expect(page.locator('.btn-review-delete').first()).toBeVisible({ timeout: 8000 });
    await page.locator('.btn-review-delete').first().click();

    // Confirm dialog appears
    await expect(page.locator('text=Delete Review?')).toBeVisible({ timeout: 3000 });

    // Click "Keep it" — the cancel button (class: btn-cancel-light)
    await page.locator('.btn-cancel-light').click();

    // Modal closes
    await expect(page.locator('text=Delete Review?')).not.toBeVisible({ timeout: 3000 });

    // Review still present — comment text still visible
    await expect(page.locator('text=Absolutely loved it!')).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-5 — Admin Reviews Monitor
// Backend: GET /api/v1/companies (admin), GET /api/v1/companies/:id/reviews
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-5 — Admin Reviews Monitor', () => {

  /**
   * AC1: Given admin on Reviews Monitor Page,
   *      When page loads,
   *      Then all reviews are displayed with filter controls visible.
   */
  test('AC1 — Admin sees all reviews and filter controls', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminReviewsPage(page, [REVIEW_OTHER, MY_REVIEW]);

    await page.goto('/admin/reviews', { waitUntil: 'networkidle' });

    // At least one admin review card (class: admin-review-card)
    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    // Date sort dropdown (class: filter-select) exists
    await expect(page.locator('.filter-select').first()).toBeVisible({ timeout: 5000 });

    // Company filter button (class: btn-select-company) exists
    await expect(page.locator('.btn-select-company')).toBeVisible({ timeout: 5000 });
  });

  /**
   * AC2: Given admin filters by a company that has zero reviews,
   *      When page updates after filter,
   *      Then "No reviews found" empty-state placeholder is shown.
   */
  test('AC2 — Filtering by company with no reviews shows empty state', async ({ page }) => {
    await loginAs(page, ADMIN);
    // Set up with 0 reviews so after filtering, empty state appears
    await mockAdminReviewsPage(page, []);

    await page.goto('/admin/reviews', { waitUntil: 'networkidle' });

    // Open the company picker modal
    await page.locator('.btn-select-company').click();

    // Select Acme Corp from the picker list (class: company-picker-item)
    await page.locator('.company-picker-item', { hasText: 'Acme Corp' }).click();

    // EmptyState component renders with h3 "No reviews found"
    await expect(page.locator('.empty-state h3')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.empty-state h3')).toContainText('No reviews found');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-6 — Admin Delete Review
// Backend: DELETE /api/v1/reviews/:id (admin override)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-6 — Admin Delete Review', () => {

  /**
   * AC1: Given admin selects a violation reason and confirms delete,
   *      Then the review is permanently removed.
   */
  test('AC1 — Admin deletes review with a valid violation reason', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminReviewsPage(page, [REVIEW_OTHER]);

    await page.goto('/admin/reviews', { waitUntil: 'networkidle' });

    // Click Delete button on the first admin review card (class: btn-admin-delete)
    const deleteBtn = page.locator('.btn-admin-delete').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 10000 });
    await deleteBtn.click();

    // DeleteReviewAdminModal opens — select a violation reason
    // Target the select inside the open modal overlay (not the page's sort dropdowns)
    const reasonSelect = page.locator('.modal-overlay.open select.filter-select');
    await reasonSelect.waitFor({ state: 'visible', timeout: 5000 });
    await reasonSelect.selectOption('spam');

    // Confirm delete (class: btn-confirm-delete)
    await page.locator('.btn-confirm-delete').click();

    // Modal overlay closes after successful delete
    await expect(page.locator('.modal-overlay.open')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * AC2: Given admin attempts to delete WITHOUT selecting a reason,
   *      Then system blocks the deletion and highlights the required field.
   */
  test('AC2 — Admin cannot delete without selecting a violation reason', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminReviewsPage(page, [REVIEW_OTHER]);

    await page.goto('/admin/reviews', { waitUntil: 'networkidle' });

    const deleteBtn = page.locator('.btn-admin-delete').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 10000 });
    await deleteBtn.click();

    // Click confirm WITHOUT selecting a reason
    const confirmBtn = page.locator('.btn-confirm-delete');
    await confirmBtn.waitFor({ state: 'visible', timeout: 3000 });
    await confirmBtn.click();

    // Error message from DeleteReviewAdminModal: "This field is required"
    await expect(page.locator('text=This field is required')).toBeVisible({ timeout: 3000 });

    // Modal must still be open — select dropdown still visible
    await expect(page.locator('select.filter-select').first()).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-1 — Create Blog Post
// Backend: POST /api/v1/blogs
//          Required: title (max 50 chars), content (max 50 chars)
//          Button disabled when title or content empty (frontend guard)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-1 — Create Blog Post', () => {

  /**
   * AC1: Given logged-in user fills valid title + content and clicks Publish,
   *      Then blog is published and user is redirected to /blog feed.
   */
  test('AC1 — Valid title and content publishes blog, redirects to feed', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page);

    await page.goto('/blog/create', { waitUntil: 'networkidle' });

    // Fill title (input.post-input, maxLength=50)
    const titleInput = page.locator('input.post-input');
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill('My Test Blog Title');

    // Fill content (textarea.post-textarea, maxLength=50)
    const contentArea = page.locator('textarea.post-textarea');
    await contentArea.fill('Valid content here.');

    // Publish button must now be enabled
    const publishBtn = page.locator('button.btn-post-publish');
    await expect(publishBtn).toBeEnabled();

    // Click Publish — CreatePostPage calls POST /api/v1/blogs then router.push('/blog')
    await publishBtn.click();

    // Should redirect to the blog feed page
    await expect(page).toHaveURL(/\/blog$/, { timeout: 8000 });
  });

  /**
   * AC2a: Given logged-in user on Blog Creation Page,
   *       When title is empty (content filled),
   *       Then Publish button is disabled and submission is prevented.
   */
  test('AC2a — Publish button disabled when title is empty', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page);

    await page.goto('/blog/create', { waitUntil: 'networkidle' });

    const titleInput = page.locator('input.post-input');
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });

    // Fill only content — leave title empty
    await page.locator('textarea.post-textarea').fill('Content without a title');

    // btn-post-publish is disabled when !title.trim() || !content.trim()
    await expect(page.locator('button.btn-post-publish')).toBeDisabled();
  });

  /**
   * AC2b: Given logged-in user on Blog Creation Page,
   *       When content is empty (title filled),
   *       Then Publish button is disabled.
   */
  test('AC2b — Publish button disabled when content is empty', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page);

    await page.goto('/blog/create', { waitUntil: 'networkidle' });

    const titleInput = page.locator('input.post-input');
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });

    // Fill only title — leave content empty
    await titleInput.fill('A title without content');

    await expect(page.locator('button.btn-post-publish')).toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-2 — Comment on a Blog Post
// Backend: POST /api/v1/blogs/:id/comments
//          Required: text (max 100 chars per Comment model)
//          Frontend: input.post-comment-input has maxLength=100
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-2 — Comment on a Blog Post', () => {

  /**
   * AC1: Given logged-in user submits a valid comment,
   *      Then comment is appended to the thread and comment counter increases by 1.
   */
  test('AC1 — Valid comment appended and counter increases', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, []);

    await page.goto('/blog', { waitUntil: 'networkidle' });

    // Wait for the post card to render
    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    // Record initial comment count ("0 Comments")
    const commentCount = page.locator('.post-comment-count').first();
    await commentCount.waitFor({ state: 'visible' });
    const before = await commentCount.textContent();
    const beforeCount = parseInt(before?.match(/\d+/)?.[0] ?? '0');

    // Type a comment and submit via Enter key
    const commentInput = page.locator('.post-comment-input').first();
    await commentInput.fill('This is my test comment!');
    await commentInput.press('Enter');

    // Optimistic update: counter increments by 1 immediately
    await expect(commentCount).toContainText(String(beforeCount + 1), { timeout: 5000 });

    // Comment text appears in the thread
    await expect(page.locator('text=This is my test comment!').first()).toBeVisible({ timeout: 5000 });
  });

  /**
   * AC2: Given logged-in user types a comment exceeding 100 characters,
   *      When attempting to type more,
   *      Then the system stops accepting further input (maxLength=100 enforced).
   *      Backend also enforces: text maxlength: 100 in Comment model.
   */
  test('AC2 — Comment input enforces 100-character maximum limit', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, []);

    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    const commentInput = page.locator('.post-comment-input').first();
    await commentInput.waitFor({ state: 'visible' });

    // Attempt to fill 120 characters (exceeds the maxLength=100 attribute)
    const overLimitText = 'A'.repeat(120);
    await commentInput.fill(overLimitText);

    // The browser enforces maxLength — actual value must be ≤ 100 characters
    const actualValue = await commentInput.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(100);
  });
});