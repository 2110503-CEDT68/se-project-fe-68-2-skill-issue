/**
 * Playwright Test Suite — G17 Additional Tests
 * Covers: US2-3 to US2-12 (TC9 – TC18)
 *
 * Architecture:
 *   - All API calls intercepted via page.route() — no live backend needed
 *   - localStorage seeded via page.addInitScript() to simulate logged-in state
 *   - CSS selectors confirmed from source-code analysis
 *
 * API URL patterns (confirmed from lib files):
 *   GET  /api/v1/blogs?page=&limit=&search=   — list / search posts
 *   GET  /api/v1/blogs/:id                     — single post
 *   PUT  /api/v1/blogs/:id                     — edit post
 *   DELETE /api/v1/blogs/:id                   — delete post
 *   GET  /api/v1/blogs/:id/comments            — list comments
 *   POST /api/v1/blogs/:id/comments            — create comment
 *   PUT  /api/v1/comments/:id                  — edit comment
 *   DELETE /api/v1/comments/:id               — delete comment
 *   GET  /api/v1/auth/me                       — admin guard
 */

import { test, expect, Page } from '@playwright/test';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

const BLOG_POST = {
  _id: 'post-001',
  title: 'Hello Job Fair Post',
  content: 'Hello world content about the job fair.',
  author: { _id: USER._id, name: USER.name },
  numComments: 2,
  edited: false,
  createdAt: '2024-03-01T09:00:00.000Z',
  effectiveDate: '2024-03-01T09:00:00.000Z',
};

const MY_COMMENT = {
  _id: 'comment-mine',
  text: 'This is my comment.',
  author: { _id: USER._id, name: USER.name },
  blog: BLOG_POST._id,
  edited: false,
  createdAt: '2024-03-02T09:00:00.000Z',
};

const OTHER_COMMENT = {
  _id: 'comment-other',
  text: 'This is another comment.',
  author: { _id: 'other-user-999', name: 'Other User' },
  blog: BLOG_POST._id,
  edited: false,
  createdAt: '2024-03-02T10:00:00.000Z',
};

const COMPANY = {
  _id: 'company-001',
  name: 'Outer Space Inc.',
  address: '123 Space St, Bangkok',
  description: 'Leading space technology company.',
  averageRating: 4.5,
  numReviews: 1,
  imgSrc: '',
};

const MY_REVIEW = {
  _id: 'review-001',
  rating: 5,
  comment: 'Great ads company to work for.',
  user: { _id: USER._id, name: USER.name },
  edited: false,
  createdAt: '2024-03-01T09:00:00.000Z',
  effectiveDate: '2024-03-01T09:00:00.000Z',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAs(page: Page, user: typeof USER | typeof ADMIN) {
  await page.addInitScript((u) => {
    localStorage.setItem('jf_token', 'mock-token-123');
    localStorage.setItem('jf_user', JSON.stringify(u));
  }, user);
  // Next.js middleware reads jf_token from cookies, not localStorage.
  // Set the cookie so /admin/* and /blog/create routes are not redirected to /login.
  await page.context().addCookies([{
    name: 'jf_token',
    value: 'mock-token-123',
    domain: 'localhost',
    path: '/',
  }]);
}

/**
 * Wire up all API routes needed for the blog feed / blog detail pages.
 *
 * @param page        Playwright Page
 * @param posts       Array of posts returned by the list endpoint
 * @param comments    Comments keyed by postId
 */
async function mockBlogAPIs(
  page: Page,
  posts: object[] = [BLOG_POST],
  comments: Record<string, object[]> = {}
) {
  // ── comment CRUD (PUT / DELETE /api/v1/comments/:id) ──────────────────────
  // Register before the broader blog routes so it takes priority.
  await page.route('**/comments/**', (route) => {
    const method = route.request().method();
    if (method === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { text: body.text, edited: true } }),
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

  // ── Comments per post (GET / POST /api/v1/blogs/:id/comments) ─────────────
  await page.route(`**/blogs/${BLOG_POST._id}/comments`, (route) => {
    const method = route.request().method();
    const postComments = comments[BLOG_POST._id] ?? [];
    if (method === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, count: postComments.length, data: postComments }),
      });
    } else if (method === 'POST') {
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
            edited: false,
            createdAt: new Date().toISOString(),
          },
        }),
      });
    } else {
      route.continue();
    }
  });

  // ── Single post (GET / PUT / DELETE /api/v1/blogs/:id) ────────────────────
  await page.route(`**/blogs/${BLOG_POST._id}`, (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: BLOG_POST }),
      });
    } else if (method === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { ...BLOG_POST, ...body } }),
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

  // ── Blog list (GET /api/v1/blogs?page=&limit=&search=) ────────────────────
  // Use a URL predicate: glob `**/blogs` would NOT match `…/blogs?page=1` because
  // the full URL string doesn't end with `/blogs` when a query-string is present.
  // url.pathname strips the query-string, so endsWith('/blogs') works correctly.
  await page.route((url) => url.pathname.endsWith('/blogs'), (route) => {
    if (route.request().method() !== 'GET') { route.continue(); return; }

    // Parse search query from the request URL
    let url: URL;
    try { url = new URL(route.request().url()); } catch { url = new URL('http://x/blogs'); }
    const search = url.searchParams.get('search') ?? '';

    const filtered = search
      ? (posts as typeof BLOG_POST[]).filter(
          (p) =>
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.content.toLowerCase().includes(search.toLowerCase())
        )
      : posts;

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        count: filtered.length,
        pagination: {
          page: 1,
          totalPages: filtered.length > 0 ? 1 : 0,
          total: filtered.length,
        },
        data: filtered,
      }),
    });
  });

  // ── Bookings stub (prevents console errors in some pages) ─────────────────
  await page.route('**/bookings**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, count: 0, data: [] }),
    });
  });
}

/** Adds admin auth/me mock on top of blog mocks. */
async function mockAdminBlogAPIs(
  page: Page,
  posts: object[] = [BLOG_POST],
  comments: Record<string, object[]> = {}
) {
  await page.route('**/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: ADMIN }),
    });
  });
  await mockBlogAPIs(page, posts, comments);
}

/**
 * Mock all API routes needed for the company profile page (/company/:id).
 * Mocks: GET company, GET/POST reviews for company, PUT/DELETE review.
 */
async function mockCompanyAPIs(page: Page, reviews: object[] = []) {
  // Auth guard for protected /company route
  await page.route('**/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: USER }),
    });
  });

  // Booking status stub — not under test, prevent console errors
  await page.route('**/bookings**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, count: 0, data: [] }),
    });
  });

  // GET /api/v1/companies/company-001
  await page.route('**/companies/company-001', (route) => {
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

  // GET /POST /api/v1/companies/company-001/reviews
  await page.route('**/companies/company-001/reviews', (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, count: reviews.length, data: reviews }),
      });
    } else if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...MY_REVIEW, rating: body.rating ?? 5, comment: body.comment ?? MY_REVIEW.comment },
        }),
      });
    } else {
      route.continue();
    }
  });

  // PUT / DELETE /api/v1/reviews/:id
  await page.route((url) => /\/reviews\/[\w-]+$/.test(url.pathname), (route) => {
    const method = route.request().method();
    if (method === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { ...MY_REVIEW, ...body } }),
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
}

/**
 * Mock all API routes needed for the admin reviews page (/admin/reviews).
 * Mocks: auth/me (admin), GET companies, GET reviews per company, DELETE review.
 */
async function mockAdminReviewsAPIs(page: Page, reviews: object[] = [MY_REVIEW]) {
  // Auth guard
  await page.route('**/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: ADMIN }),
    });
  });

  // GET /api/v1/companies — list all companies (no trailing path after /companies)
  await page.route((url) => url.pathname.endsWith('/companies'), (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, count: 1, data: [COMPANY] }),
      });
    } else {
      route.continue();
    }
  });

  // GET /api/v1/companies/company-001/reviews
  await page.route('**/companies/company-001/reviews', (route) => {
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

  // DELETE /api/v1/reviews/:id
  await page.route((url) => /\/reviews\/[\w-]+$/.test(url.pathname), (route) => {
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
}

// ═════════════════════════════════════════════════════════════════════════════
// US 2-3 — User sees any blogs (Blog Feed Search)
// Backend: GET /api/v1/blogs?search=&page=1&limit=6
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-3 — User sees any blogs', () => {

  /**
   * TC9-1: Empty search input → all posts displayed.
   */
  test('TC9-1 — Empty search shows all blog posts', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST]);
    await page.goto('/blog', { waitUntil: 'networkidle' });

    // At least one post card is visible
    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    // The post's title is visible on screen
    await expect(page.locator(`text=${BLOG_POST.title}`).first()).toBeVisible();
  });

  /**
   * TC9-2: Search input = "Hello" → posts matching "Hello" shown.
   */
  test('TC9-2 — Search "Hello" shows matching blog posts', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST]);
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    // Type in the search box
    const searchInput = page.locator('input.blog-search');
    await searchInput.fill('Hello');

    // The mock filters server-side; BLOG_POST.title contains "Hello"
    await expect(page.locator(`text=${BLOG_POST.title}`).first()).toBeVisible({ timeout: 6000 });
  });

  /**
   * TC9-3: Search input = "Handsome" → no results placeholder shown.
   */
  test('TC9-3 — Search "Handsome" shows no results', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST]);
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    const searchInput = page.locator('input.blog-search');
    await searchInput.fill('Handsome');

    // The mock returns an empty list for "Handsome" → .blog-empty appears
    await expect(page.locator('.blog-empty').first()).toBeVisible({ timeout: 6000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-4 — User sees any comments
// Backend: GET /api/v1/blogs/:id/comments (called inside PostCard)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-4 — User sees any comments', () => {

  /**
   * TC10-1: Blog has comments → comment list is visible.
   */
  test('TC10-1 — Blog with comments shows comment list', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT, OTHER_COMMENT] });
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    // Individual comment items rendered inside the card
    await expect(page.locator('.post-comment-item').first()).toBeVisible({ timeout: 5000 });

    // Comment text is displayed
    await expect(page.locator(`text=${MY_COMMENT.text}`).first()).toBeVisible();
  });

  /**
   * TC10-2: Blog has zero comments → placeholder "Be the first to comment!" shown.
   */
  test('TC10-2 — Blog with no comments shows placeholder', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [] });
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    // Placeholder text (from PostCard JSX: className="no-comments-placeholder")
    await expect(
      page.locator('text=Be the first to comment!').first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-5 — User edits their blog post
// Backend: GET /api/v1/blogs/:id, PUT /api/v1/blogs/:id
// Page: /blog/:id/edit  (EditPostPage)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-5 — User edits blog post', () => {

  /**
   * TC11-1: Valid title + content → "Update Post" button enabled; after submit
   *          page redirects to the blog detail page.
   */
  test('TC11-1 — Valid title and content saves and redirects', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST]);
    await page.goto(`/blog/${BLOG_POST._id}/edit`, { waitUntil: 'networkidle' });

    const titleInput = page.locator('input.post-input');
    await titleInput.waitFor({ state: 'visible', timeout: 8000 });

    await titleInput.fill('Test blog 1.5');
    await page.locator('textarea.post-textarea').fill('tb1.5');

    const updateBtn = page.locator('button.btn-post-publish');
    await expect(updateBtn).toBeEnabled();
    await updateBtn.click();

    // Redirect to blog detail page after successful update
    await expect(page).toHaveURL(new RegExp(`/blog/${BLOG_POST._id}`), { timeout: 8000 });
  });

  /**
   * TC11-2: Empty title (with content filled) → "Update Post" button disabled.
   */
  test('TC11-2 — Empty title disables the Update Post button', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST]);
    await page.goto(`/blog/${BLOG_POST._id}/edit`, { waitUntil: 'networkidle' });

    const titleInput = page.locator('input.post-input');
    await titleInput.waitFor({ state: 'visible', timeout: 8000 });

    // Clear title, fill content
    await titleInput.clear();
    await page.locator('textarea.post-textarea').fill('I think Mars has many resources');

    // Button should be disabled when !title.trim()
    await expect(page.locator('button.btn-post-publish')).toBeDisabled();
  });

  /**
   * TC11-3: Empty content (with title filled) → "Update Post" button disabled.
   */
  test('TC11-3 — Empty content disables the Update Post button', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST]);
    await page.goto(`/blog/${BLOG_POST._id}/edit`, { waitUntil: 'networkidle' });

    const titleInput = page.locator('input.post-input');
    await titleInput.waitFor({ state: 'visible', timeout: 8000 });

    // Fill title, clear content
    await titleInput.fill('Outer Space');
    await page.locator('textarea.post-textarea').clear();

    await expect(page.locator('button.btn-post-publish')).toBeDisabled();
  });

  /**
   * TC11-4: User modifies content then clicks "← Back" (safeNavigate) →
   *          "Unsaved Changes" warning modal appears.
   */
  test('TC11-4 — Navigating away with unsaved changes shows warning modal', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST]);
    await page.goto(`/blog/${BLOG_POST._id}/edit`, { waitUntil: 'networkidle' });

    const titleInput = page.locator('input.post-input');
    await titleInput.waitFor({ state: 'visible', timeout: 8000 });

    // Make a change to trigger isDirty
    await titleInput.fill('Changed Title');

    // Wait for React to process the new value before we click away;
    // without this the click might race against the state update.
    await expect(titleInput).toHaveValue('Changed Title');

    // Click "← Back" (.blog-back-link is rendered as <a> tag in the running app)
    await page.locator('.blog-back-link').click();

    // UnsavedChangeModal renders .modal-overlay.open + h3 "Unsaved Changes"
    await expect(page.locator('.modal-overlay.open')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Unsaved Changes')).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-6 — User edits their comment
// Frontend: PostCard → btn-comment-edit → EditCommentModal
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-6 — User edits comment', () => {

  /**
   * TC12-1: Valid comment text → modal closes and comment is updated.
   */
  test('TC12-1 — Valid comment saves and closes the modal', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    // Click Edit on the comment (btn-comment-edit, only shown for isMe && !isAdmin)
    const editBtn = page.locator('.btn-comment-edit').first();
    await editBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editBtn.dispatchEvent('click');

    // EditCommentModal opens — heading "Edit Comment"
    await expect(page.locator('text=Edit Comment')).toBeVisible({ timeout: 8000 });

    // Fill new valid text into the modal textarea (post-textarea inside modal)
    const textarea = page.locator('textarea.post-textarea').first();
    await textarea.clear();
    await textarea.fill('test');

    // Confirm button ("Update") enabled and click it
    const confirmBtn = page.locator('.btn-modal-confirm').first();
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Modal closes
    await expect(page.locator('text=Edit Comment')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * TC12-2: Empty comment text → "Update" confirm button is disabled.
   */
  test('TC12-2 — Empty comment text disables the confirm button', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    const editBtn = page.locator('.btn-comment-edit').first();
    await editBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editBtn.dispatchEvent('click');

    await expect(page.locator('text=Edit Comment')).toBeVisible({ timeout: 8000 });

    // Clear all text (disabled={loading || !text.trim()})
    const textarea = page.locator('textarea.post-textarea').first();
    await textarea.clear();

    // Confirm button must be disabled
    await expect(page.locator('.btn-modal-confirm').first()).toBeDisabled();
  });

  /**
   * TC12-3: Click "Cancel" → modal closes and original comment text is preserved.
   */
  test('TC12-3 — Cancel closes the edit modal without saving', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    const editBtn = page.locator('.btn-comment-edit').first();
    await editBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editBtn.dispatchEvent('click');

    await expect(page.locator('text=Edit Comment')).toBeVisible({ timeout: 8000 });

    // Click "Cancel" — calls handleCloseRequest; since text unchanged (not dirty), closes directly
    await page.locator('.modal-overlay.open .btn-modal-cancel').click({ force: true });

    // Modal closes
    await expect(page.locator('text=Edit Comment')).not.toBeVisible({ timeout: 3000 });

    // Original comment text still visible
    await expect(page.locator(`text=${MY_COMMENT.text}`).first()).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-7 — User deletes their blog post
// Frontend: btn-post-delete-pill → DeletePostModal
//           Confirm: btn-modal-confirm ("Yes, Delete")
//           Cancel: btn-modal-cancel ("Keep It")
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-7 — User deletes blog post', () => {

  /**
   * TC13-1: Confirm deletion → confirmation modal closes.
   */
  test('TC13-1 — Confirming delete closes the delete modal', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST]);
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    // Click the Delete pill on the owned post
    const deleteBtn = page.locator('.btn-post-delete-pill').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteBtn.click();

    // DeletePostModal: "Delete Post?" heading
    await expect(page.locator('text=Delete Post?')).toBeVisible({ timeout: 3000 });

    // Confirm by clicking "Yes, Delete" (btn-modal-confirm)
    await page.locator('.btn-modal-confirm').first().click();

    // Modal closes
    await expect(page.locator('text=Delete Post?')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * TC13-2: Click "Keep It" → modal closes, post stays in the feed.
   */
  test('TC13-2 — "Keep It" cancels deletion and post remains', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST]);
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    const deleteBtn = page.locator('.btn-post-delete-pill').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteBtn.click();

    await expect(page.locator('text=Delete Post?')).toBeVisible({ timeout: 3000 });

    // Cancel by clicking "Keep It" (btn-modal-cancel)
    await page.locator('.modal-overlay.open .btn-modal-cancel').click({ force: true });

    // Modal closes
    await expect(page.locator('text=Delete Post?')).not.toBeVisible({ timeout: 3000 });

    // Post is still visible in the feed
    await expect(page.locator(`text=${BLOG_POST.title}`).first()).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-8 — User deletes their comment
// Frontend: btn-comment-delete-pill → DeleteCommentModal
//           Confirm: "Confirm Deletion" | Cancel: "Cancel"
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-8 — User deletes comment', () => {

  /**
   * TC14-1: Confirm deletion → delete modal closes.
   */
  test('TC14-1 — Confirming delete closes the delete comment modal', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    const deleteCommentBtn = page.locator('.btn-comment-delete-pill').first();
    await deleteCommentBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteCommentBtn.click();

    // DeleteCommentModal: "Delete Comment?" heading
    await expect(page.locator('text=Delete Comment?')).toBeVisible({ timeout: 3000 });

    // Confirm — "Confirm Deletion" (btn-modal-confirm)
    await page.locator('.btn-modal-confirm').first().click();

    // Modal closes
    await expect(page.locator('text=Delete Comment?')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * TC14-2: Click "Cancel" → modal closes, comment remains.
   */
  test('TC14-2 — "Cancel" keeps the comment visible', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    const deleteCommentBtn = page.locator('.btn-comment-delete-pill').first();
    await deleteCommentBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteCommentBtn.click();

    await expect(page.locator('text=Delete Comment?')).toBeVisible({ timeout: 3000 });

    // Cancel
    await page.locator('.modal-overlay.open .btn-modal-cancel').click({ force: true });

    // Modal closes
    await expect(page.locator('text=Delete Comment?')).not.toBeVisible({ timeout: 3000 });

    // Comment still present
    await expect(page.locator(`text=${MY_COMMENT.text}`).first()).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-9 — Admin sees any users' blogs
// Page: /admin/blog  (Blogs Monitor)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-9 — Admin sees any blogs', () => {

  /**
   * TC15-1: Empty search → all posts displayed.
   */
  test('TC15-1 — Empty search shows all blog posts', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST]);
    await page.goto('/admin/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${BLOG_POST.title}`).first()).toBeVisible();
  });

  /**
   * TC15-2: Search = "Hello" → posts matching "Hello" shown.
   */
  test('TC15-2 — Search "Hello" shows matching blog posts', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST]);
    await page.goto('/admin/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator('input.blog-search');
    await searchInput.fill('Hello');

    // BLOG_POST.title contains "Hello" — mock returns it
    await expect(page.locator(`text=${BLOG_POST.title}`).first()).toBeVisible({ timeout: 6000 });
  });

  /**
   * TC15-3: Search = "namo" → no results placeholder shown.
   */
  test('TC15-3 — Search "namo" shows no results', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST]);
    await page.goto('/admin/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator('input.blog-search');
    await searchInput.fill('namo');

    // Mock returns empty list → .blog-empty appears
    await expect(page.locator('.blog-empty')).toBeVisible({ timeout: 6000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-10 — Admin sees any users' comments
// Page: /admin/comments  (Comments Monitor)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-10 — Admin sees any comments', () => {

  /**
   * TC16-1: Empty search → all comments shown.
   */
  test('TC16-1 — Empty search shows all comments', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/admin/comments', { waitUntil: 'networkidle' });

    // admin-review-card is used for comment rows in the comments monitor
    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${MY_COMMENT.text}`).first()).toBeVisible();
  });

  /**
   * TC16-2: Search = "Hello" → matching comments shown.
   */
  test('TC16-2 — Search "Hello" shows matching comments', async ({ page }) => {
    const helloComment = {
      ...MY_COMMENT,
      _id: 'comment-hello',
      text: 'Hello, this is a comment.',
    };
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST], {
      [BLOG_POST._id]: [helloComment, MY_COMMENT],
    });
    await page.goto('/admin/comments', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    // Admin comments search is client-side — just type in the search bar
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Hello');

    // The matching comment should remain visible (client-side filter)
    await expect(page.locator('text=Hello, this is a comment.').first()).toBeVisible({
      timeout: 5000,
    });
  });

  /**
   * TC16-3: Search = "bye" → no comments match → EmptyState shown.
   */
  test('TC16-3 — Search "bye" shows no results', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/admin/comments', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('bye');

    // EmptyState component renders when filtered.length === 0
    await expect(page.locator('text=No comments found')).toBeVisible({ timeout: 5000 });
  });

  /**
   * TC16-4: Click "View in Context" link → navigates to /admin/blog/:id.
   */
  test('TC16-4 — "View in Context" link navigates to blog post', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/admin/comments', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    // The "View in Context" link (class: comment-view-context-link)
    const viewLink = page.locator('.comment-view-context-link').first();
    await viewLink.waitFor({ state: 'visible', timeout: 5000 });
    await viewLink.click();

    // URL should change to /admin/blog/:id
    await expect(page).toHaveURL(new RegExp(`/admin/blog/${BLOG_POST._id}`), { timeout: 8000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-11 — Admin deletes any user's blog post
// Frontend: PostCard on /admin/blog → btn-post-delete-pill
//           → DeletePostAdminModal (requires policy violation reason)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-11 — Admin deletes blog post', () => {

  /**
   * TC17-1: Admin selects reason "Harassment" and confirms → modal closes.
   */
  test('TC17-1 — Admin deletes blog with a valid violation reason', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST]);
    await page.goto('/admin/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 10000 });

    // Admin delete button opens DeletePostAdminModal (not regular DeletePostModal)
    const deleteBtn = page.locator('.btn-post-delete-pill').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteBtn.click();

    // DeletePostAdminModal: "Delete Blog Post?" heading
    await expect(page.locator('text=Delete Blog Post?')).toBeVisible({ timeout: 3000 });

    // Select a policy violation reason (scoped to open modal to avoid ambiguity)
    await page.locator('.modal-overlay.open select.filter-select').selectOption('harassment');

    // Confirm delete — DeletePostAdminModal uses .btn-confirm-delete (not .btn-modal-confirm)
    await page.locator('.modal-overlay.open .btn-confirm-delete').click({ force: true });

    // Modal closes after confirmation
    await expect(page.locator('text=Delete Blog Post?')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * TC17-2: Admin clicks confirm WITHOUT selecting a reason →
   *          "This field is required" validation error shown, modal stays open.
   */
  test('TC17-2 — Admin cannot delete without selecting a violation reason', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST]);
    await page.goto('/admin/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 10000 });

    const deleteBtn = page.locator('.btn-post-delete-pill').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteBtn.click();

    await expect(page.locator('text=Delete Blog Post?')).toBeVisible({ timeout: 3000 });

    // Click confirm WITHOUT selecting a reason — DeletePostAdminModal uses .btn-confirm-delete
    await page.locator('.modal-overlay.open .btn-confirm-delete').click({ force: true });

    // Frontend validation: "This field is required"
    await expect(page.locator('text=This field is required')).toBeVisible({ timeout: 3000 });

    // Modal must still be open
    await expect(page.locator('text=Delete Blog Post?')).toBeVisible();
  });

  /**
   * TC17-3: Accessing a deleted (non-existent) blog URL → ContentRemovedPage shown.
   */
  test('TC17-3 — Accessing a deleted blog URL shows content-removed page', async ({ page }) => {
    await loginAs(page, USER);

    // Mock the blog detail endpoint to return 404 (deleted / not found)
    await page.route(`**/blogs/${BLOG_POST._id}`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Post not found' }),
        });
      } else {
        route.continue();
      }
    });

    // Stub the blog list and comments so no other requests break
    await page.route('**/blogs', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          count: 0,
          pagination: { page: 1, totalPages: 0, total: 0 },
          data: [],
        }),
      });
    });

    await page.route(`**/blogs/${BLOG_POST._id}/comments`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, count: 0, data: [] }),
      });
    });

    await page.goto(`/blog/${BLOG_POST._id}`, { waitUntil: 'networkidle' });

    // ContentRemovedPage or "not found" message — the component sets notFound=true
    // which renders ContentRemovedPage with "removed" / "not found" text
    await expect(
      page.locator('text=/removed|not found|deleted/i').first()
    ).toBeVisible({ timeout: 8000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-12 — Admin deletes any user's comment
// Frontend: /admin/comments → btn-admin-delete → DeleteCommentAdminModal
//           (requires policy reason; 5-second countdown with undo)
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-12 — Admin deletes comment', () => {

  /**
   * TC18-1: Admin selects "Offensive Content" and confirms →
   *          countdown phase starts (countdown number visible, "↩ Cancel" button shown).
   */
  test('TC18-1 — Admin confirms with valid reason and countdown begins', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/admin/comments', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    const deleteBtn = page.locator('.btn-admin-delete').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteBtn.click();

    // DeleteCommentAdminModal: "Delete Comment" heading (no "?")
    await expect(page.locator('text=Delete Comment')).toBeVisible({ timeout: 3000 });

    // Select reason "Offensive Content" (scoped to open modal to avoid ambiguity)
    await page.locator('.modal-overlay.open select.filter-select').selectOption('offensive');

    // Confirm → triggers countdown — DeleteCommentAdminModal uses .btn-confirm-delete
    await page.locator('.modal-overlay.open .btn-confirm-delete').click({ force: true });

    // After confirm, countdown view replaces form:
    // "Deleting comment" text and "↩ Cancel" undo button are shown
    await expect(page.locator('text=Deleting comment')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.modal-overlay.open .btn-modal-cancel')).toBeVisible({ timeout: 3000 });
  });

  /**
   * TC18-2: Admin clicks confirm WITHOUT selecting a reason →
   *          "This field is required" validation error; modal stays open.
   */
  test('TC18-2 — Admin cannot delete without selecting a violation reason', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/admin/comments', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    const deleteBtn = page.locator('.btn-admin-delete').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteBtn.click();

    await expect(page.locator('text=Delete Comment')).toBeVisible({ timeout: 3000 });

    // Click confirm WITHOUT selecting a reason — DeleteCommentAdminModal uses .btn-confirm-delete
    await page.locator('.btn-confirm-delete').first().click();

    // Validation error
    await expect(page.locator('text=This field is required')).toBeVisible({ timeout: 3000 });

    // Modal stays open (still showing form, not countdown)
    await expect(page.locator('text=Delete Comment')).toBeVisible();
  });

  /**
   * TC18-3: After confirming (countdown started), admin clicks "↩ Cancel" within
   *          5 seconds → countdown stops; comment card is still present.
   */
  test('TC18-3 — Admin can undo deletion within 5 seconds', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [MY_COMMENT] });
    await page.goto('/admin/comments', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    const deleteBtn = page.locator('.btn-admin-delete').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteBtn.click();

    await expect(page.locator('text=Delete Comment')).toBeVisible({ timeout: 3000 });

    // Select reason + confirm to start countdown — scoped to open modal
    await page.locator('.modal-overlay.open select.filter-select').selectOption('offensive');
    await page.locator('.modal-overlay.open .btn-confirm-delete').click({ force: true });

    // Countdown view appears — click "↩ Cancel" (btn-modal-cancel in countdown view)
    const undoBtn = page.locator('.modal-overlay.open .btn-modal-cancel');
    await undoBtn.waitFor({ state: 'visible', timeout: 3000 });
    await undoBtn.click({ force: true });

    // After undo, countdown stops and the comment card must still be visible
    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 3000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-1 — User submits a review
// Page: /company/:id → CreateReviewModal
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-1 — User submits a review', () => {

  /**
   * TC1-1: Rating selected + comment filled → review is created successfully.
   */
  test('TC1-1 — Submit a review with rating and comment submits successfully', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyAPIs(page, []);
    await page.goto('/company/company-001', { waitUntil: 'networkidle' });

    // CompanyHeader shows "Reviews Now!" when logged in and no existing review
    const reviewBtn = page.locator('.btn-review-now');
    await reviewBtn.waitFor({ state: 'visible', timeout: 8000 });
    await reviewBtn.click();

    // Select 5th star (index 4)
    await page.locator('.star-btn').nth(4).click();

    // Fill comment
    await page.locator('.review-textarea').fill('Amazing company!');

    // Submit via "Publish" button (btn-modal-confirm)
    await page.locator('.btn-modal-confirm').click();

    // After successful submit, review card appears in the feed
    await expect(page.locator('.review-card').first()).toBeVisible({ timeout: 5000 });
  });

  /**
   * TC1-2: No star rating selected → "Please select a star rating." error.
   */
  test('TC1-2 — Submit without rating shows validation error', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyAPIs(page, []);
    await page.goto('/company/company-001', { waitUntil: 'networkidle' });

    const reviewBtn = page.locator('.btn-review-now');
    await reviewBtn.waitFor({ state: 'visible', timeout: 8000 });
    await reviewBtn.click();

    // Fill comment but skip star rating
    await page.locator('.review-textarea').fill('Great place!');

    // Submit without rating
    await page.locator('.btn-modal-confirm').click();

    // Inline validation error
    await expect(page.locator('text=Please select a star rating.')).toBeVisible({ timeout: 3000 });
  });

  /**
   * TC1-3: Stars selected but empty comment → "Please write a comment." error.
   */
  test('TC1-3 — Submit without comment shows validation error', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyAPIs(page, []);
    await page.goto('/company/company-001', { waitUntil: 'networkidle' });

    const reviewBtn = page.locator('.btn-review-now');
    await reviewBtn.waitFor({ state: 'visible', timeout: 8000 });
    await reviewBtn.click();

    // Select 3 stars but leave comment empty
    await page.locator('.star-btn').nth(2).click();

    // Submit without comment
    await page.locator('.btn-modal-confirm').click();

    // Inline validation error
    await expect(page.locator('text=Please write a comment.')).toBeVisible({ timeout: 3000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-2 — User views reviews
// Page: /company/:id → ReviewsFeed
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-2 — User views reviews', () => {

  /**
   * TC2-1: Company with reviews → review cards are displayed.
   */
  test('TC2-1 — Company with reviews shows review cards and average rating', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyAPIs(page, [MY_REVIEW]);
    await page.goto('/company/company-001', { waitUntil: 'networkidle' });

    await expect(page.locator('.review-card').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator(`text=${MY_REVIEW.comment}`).first()).toBeVisible();
  });

  /**
   * TC2-2: Company with no reviews → empty state placeholder shown.
   */
  test('TC2-2 — Company with no reviews shows empty state placeholder', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyAPIs(page, []);
    await page.goto('/company/company-001', { waitUntil: 'networkidle' });

    await expect(page.locator('.no-reviews-placeholder')).toBeVisible({ timeout: 8000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-3 — User edits their review
// Page: /company/:id → EditReviewModal
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-3 — User edits a review', () => {

  /**
   * TC3-1: Valid edited comment → modal closes after saving.
   */
  test('TC3-1 — Valid edited review saves and closes the modal', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyAPIs(page, [MY_REVIEW]);
    await page.goto('/company/company-001', { waitUntil: 'networkidle' });

    // "✏️ Edit Review" button shown when user already has a review
    const editBtn = page.locator('.btn-review-now');
    await editBtn.waitFor({ state: 'visible', timeout: 8000 });
    await editBtn.click();

    // EditReviewModal opens with heading "Edit Your Review"
    await expect(page.locator('text=Edit Your Review')).toBeVisible({ timeout: 5000 });

    // Change the comment text
    const textarea = page.locator('.review-textarea');
    await textarea.clear();
    await textarea.fill('Updated review text.');

    // Click "Save Changes" (btn-modal-confirm)
    await page.locator('.btn-modal-confirm').click();

    // Modal closes
    await expect(page.locator('text=Edit Your Review')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * TC3-2: Empty comment → "Save Changes" button is disabled.
   */
  test('TC3-2 — Empty comment disables the "Save Changes" confirm button', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyAPIs(page, [MY_REVIEW]);
    await page.goto('/company/company-001', { waitUntil: 'networkidle' });

    const editBtn = page.locator('.btn-review-now');
    await editBtn.waitFor({ state: 'visible', timeout: 8000 });
    await editBtn.click();

    await expect(page.locator('text=Edit Your Review')).toBeVisible({ timeout: 5000 });

    // Clear the comment textarea
    await page.locator('.review-textarea').clear();

    // Confirm button should be disabled when comment is empty
    await expect(page.locator('.btn-modal-confirm')).toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-4 — User deletes their review
// Page: /company/:id → DeleteReviewModal
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-4 — User deletes a review', () => {

  /**
   * TC4-1: Confirm deletion → modal closes and review is removed from UI.
   */
  test('TC4-1 — Confirming deletion removes the review from UI', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyAPIs(page, [MY_REVIEW]);
    await page.goto('/company/company-001', { waitUntil: 'networkidle' });

    await expect(page.locator('.review-card').first()).toBeVisible({ timeout: 8000 });

    // Click the Delete button on the review card
    await page.locator('.btn-review-delete').first().click();

    // DeleteReviewModal: "Delete Review?" heading
    await expect(page.locator('text=Delete Review?')).toBeVisible({ timeout: 3000 });

    // Confirm — "Yes, Delete it" (btn-confirm-delete)
    await page.locator('.btn-confirm-delete').click();

    // Modal closes
    await expect(page.locator('text=Delete Review?')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * TC4-2: Click "Keep it" → modal closes, review remains visible.
   */
  test('TC4-2 — Cancelling deletion keeps the review visible', async ({ page }) => {
    await loginAs(page, USER);
    await mockCompanyAPIs(page, [MY_REVIEW]);
    await page.goto('/company/company-001', { waitUntil: 'networkidle' });

    await expect(page.locator('.review-card').first()).toBeVisible({ timeout: 8000 });

    await page.locator('.btn-review-delete').first().click();
    await expect(page.locator('text=Delete Review?')).toBeVisible({ timeout: 3000 });

    // Cancel — "Keep it" (btn-cancel-light)
    await page.locator('.btn-cancel-light').click();

    // Modal closes
    await expect(page.locator('text=Delete Review?')).not.toBeVisible({ timeout: 3000 });

    // Review card still present
    await expect(page.locator(`text=${MY_REVIEW.comment}`).first()).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-5 — Admin sees all reviews and filter controls
// Page: /admin/reviews
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-5 — Admin sees all reviews and filter controls', () => {

  /**
   * TC5-1: Reviews loaded → admin-review-card and filter controls are visible.
   */
  test('TC5-1 — Admin sees all reviews with filter controls', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminReviewsAPIs(page, [MY_REVIEW]);
    await page.goto('/admin/reviews', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });
    // Filter select controls visible
    await expect(page.locator('select.filter-select').first()).toBeVisible();
  });

  /**
   * TC5-2: Search text matches review comment → review card remains visible.
   */
  test('TC5-2 — Search matching text shows review', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminReviewsAPIs(page, [MY_REVIEW]);
    await page.goto('/admin/reviews', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    // MY_REVIEW.comment contains "ads" — search for it
    await page.locator('input[placeholder*="Search"]').fill('ads');
    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 3000 });
  });

  /**
   * TC5-3: Search text matches nothing → "No reviews found" empty state.
   */
  test('TC5-3 — Search non-matching text shows no reviews found', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminReviewsAPIs(page, [MY_REVIEW]);
    await page.goto('/admin/reviews', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    await page.locator('input[placeholder*="Search"]').fill('zzzznonexistent');
    await expect(page.locator('text=No reviews found')).toBeVisible({ timeout: 3000 });
  });

  /**
   * TC5-4: No reviews in DB → page renders "No reviews found" empty state immediately.
   */
  test('TC5-4 — Admin with no reviews shows empty state', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminReviewsAPIs(page, []);
    await page.goto('/admin/reviews', { waitUntil: 'networkidle' });

    await expect(page.locator('text=No reviews found')).toBeVisible({ timeout: 10000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 1-6 — Admin deletes a review
// Page: /admin/reviews → DeleteReviewAdminModal
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US1-6 — Admin deletes a review', () => {

  /**
   * TC6-1: Selects violation reason → confirm → modal closes.
   */
  test('TC6-1 — Admin deletes review with a valid violation reason', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminReviewsAPIs(page, [MY_REVIEW]);
    await page.goto('/admin/reviews', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    // Open DeleteReviewAdminModal
    await page.locator('.btn-admin-delete').first().click();
    await expect(page.locator('text=Delete Review')).toBeVisible({ timeout: 3000 });

    // Select reason "spam"
    await page.locator('.modal-overlay.open select.filter-select').selectOption('spam');

    // Confirm — modal closes
    await page.locator('.modal-overlay.open .btn-confirm-delete').click({ force: true });
    await expect(page.locator('text=Delete Review')).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * TC6-2: No reason selected → "This field is required"; modal stays open.
   */
  test('TC6-2 — Admin cannot delete review without selecting a violation reason', async ({ page }) => {
    await loginAs(page, ADMIN);
    await mockAdminReviewsAPIs(page, [MY_REVIEW]);
    await page.goto('/admin/reviews', { waitUntil: 'networkidle' });

    await expect(page.locator('.admin-review-card').first()).toBeVisible({ timeout: 10000 });

    await page.locator('.btn-admin-delete').first().click();
    await expect(page.locator('text=Delete Review')).toBeVisible({ timeout: 3000 });

    // Click confirm without selecting reason
    await page.locator('.modal-overlay.open .btn-confirm-delete').click({ force: true });

    // Validation error shown; modal stays open
    await expect(page.locator('text=This field is required')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Delete Review')).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-1 — User creates a blog post
// Page: /blog/create
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-1 — User creates a blog post', () => {

  /**
   * TC7-1: Valid title + content → Publish enabled → click → redirected to /blog.
   */
  test('TC7-1 — Valid title and content publishes post and redirects to /blog', async ({ page }) => {
    await loginAs(page, USER);

    // Mock POST /api/v1/blogs and GET /api/v1/blogs (after redirect)
    await page.route((url) => url.pathname.endsWith('/blogs'), (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: BLOG_POST }),
        });
      } else if (method === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true, count: 0,
            pagination: { page: 1, totalPages: 0, total: 0 },
            data: [],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/blog/create', { waitUntil: 'networkidle' });

    const titleInput = page.locator('input.post-input');
    await titleInput.waitFor({ state: 'visible', timeout: 8000 });
    await titleInput.fill('How to edit my booking');

    await page.locator('textarea.post-textarea').fill('Help me please');

    // Publish button should now be enabled
    const publishBtn = page.locator('button.btn-post-publish');
    await expect(publishBtn).toBeEnabled();
    await publishBtn.click();

    // After publish, redirected to /blog
    await expect(page).toHaveURL(/\/blog$/, { timeout: 8000 });
  });

  /**
   * TC7-2: Empty title → Publish button disabled.
   */
  test('TC7-2 — Empty title disables the Publish button', async ({ page }) => {
    await loginAs(page, USER);
    await page.goto('/blog/create', { waitUntil: 'networkidle' });

    await page.locator('input.post-input').waitFor({ state: 'visible', timeout: 8000 });

    // Fill only content, leave title empty
    await page.locator('textarea.post-textarea').fill('Some content here');

    await expect(page.locator('button.btn-post-publish')).toBeDisabled();
  });

  /**
   * TC7-3: Empty content → Publish button disabled.
   */
  test('TC7-3 — Empty content disables the Publish button', async ({ page }) => {
    await loginAs(page, USER);
    await page.goto('/blog/create', { waitUntil: 'networkidle' });

    const titleInput = page.locator('input.post-input');
    await titleInput.waitFor({ state: 'visible', timeout: 8000 });
    await titleInput.fill('Some title here');

    // Content textarea is empty — publish must be disabled
    await expect(page.locator('button.btn-post-publish')).toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// US 2-2 — User comments on a blog post
// Page: /blog → PostCard comment section
// ═════════════════════════════════════════════════════════════════════════════
test.describe('US2-2 — User comments on a blog post', () => {

  /**
   * TC8-1: Type comment and send → comment counter increments.
   */
  test('TC8-1 — Submitting a comment increments the comment counter', async ({ page }) => {
    await loginAs(page, USER);
    // Start with no comments so counter begins at 0
    await mockBlogAPIs(page, [BLOG_POST], { [BLOG_POST._id]: [] });
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    // Initially 0 comments
    await expect(page.locator('.post-comment-total').first()).toContainText('Total Comments: 0');

    // Type comment and click send button
    const commentInput = page.locator('.post-comment-input').first();
    await commentInput.fill('My test comment');
    await page.locator('.post-comment-send').first().click();

    // Counter increments to 1
    await expect(page.locator('.post-comment-total').first()).toContainText('Total Comments: 1', {
      timeout: 5000,
    });
  });

  /**
   * TC8-2: Empty input → send button is disabled.
   */
  test('TC8-2 — Empty comment input disables the send button', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST], {});
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    // Send button disabled when input is empty
    await expect(page.locator('.post-comment-send').first()).toBeDisabled();
  });

  /**
   * TC8-3: Comment input enforces 100-character maximum limit.
   */
  test('TC8-3 — Comment input enforces 100-character maximum limit', async ({ page }) => {
    await loginAs(page, USER);
    await mockBlogAPIs(page, [BLOG_POST], {});
    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.locator('.post-card').first()).toBeVisible({ timeout: 8000 });

    const commentInput = page.locator('.post-comment-input').first();

    // Fill exactly 100 characters
    const hundredChars = 'a'.repeat(100);
    await commentInput.fill(hundredChars);
    await expect(commentInput).toHaveValue(hundredChars);

    // Attempt to fill 101 characters — maxLength=100 truncates input to 100
    await commentInput.fill('a'.repeat(101));
    const value = await commentInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(100);
  });
});

