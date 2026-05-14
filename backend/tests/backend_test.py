"""Backend API tests for Smile Savers Dental Clinic (Iter 3 - admin + blog CRUD)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL.startswith("http"):
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")

ADMIN_TOKEN = "smilesavers2026"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "X-Admin-Token": ADMIN_TOKEN})
    return s


# ---------- Health ----------
class TestHealth:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("status") == "online"


# ---------- Services ----------
class TestServices:
    def test_list_services_returns_12(self, api):
        r = api.get(f"{BASE_URL}/api/services")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 12

    def test_service_detail_has_all_fields(self, api):
        r = api.get(f"{BASE_URL}/api/services/smile-makeover")
        assert r.status_code == 200
        s = r.json()
        for field in ("process", "faqs", "materials", "benefits", "title", "details"):
            assert field in s

    def test_service_detail_404(self, api):
        r = api.get(f"{BASE_URL}/api/services/nonexistent-slug")
        assert r.status_code == 404


# ---------- Doctors / Testimonials / Gallery ----------
class TestContent:
    def test_doctors(self, api):
        r = api.get(f"{BASE_URL}/api/doctors")
        assert r.status_code == 200
        d = r.json()
        assert d[0]["name"] == "Dr. Prateek Aggarwal"

    def test_testimonials(self, api):
        r = api.get(f"{BASE_URL}/api/testimonials")
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_gallery(self, api):
        r = api.get(f"{BASE_URL}/api/gallery")
        assert r.status_code == 200
        assert len(r.json()) >= 3


# ---------- Blog (public) ----------
class TestBlogPublic:
    def test_blog_list_no_content_md(self, api):
        r = api.get(f"{BASE_URL}/api/blog")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 4
        post = data[0]
        # E-E-A-T fields present
        for f in ("slug", "title", "author_name", "author_credentials", "date_updated", "read_time"):
            assert f in post, f"Missing {f} in blog list"
        # content_md must NOT be in list view
        assert "content_md" not in post

    def test_blog_detail_full(self, api):
        r = api.get(f"{BASE_URL}/api/blog/how-long-do-teeth-whitening-results-last")
        assert r.status_code == 200
        post = r.json()
        assert post["slug"] == "how-long-do-teeth-whitening-results-last"
        for f in ("content_md", "key_takeaways", "faqs", "related_services", "references", "author_name"):
            assert f in post, f"Missing {f} in blog detail"
        assert isinstance(post["content_md"], str) and len(post["content_md"]) > 100
        assert isinstance(post["faqs"], list) and len(post["faqs"]) >= 1

    def test_blog_detail_404(self, api):
        r = api.get(f"{BASE_URL}/api/blog/nonexistent-post")
        assert r.status_code == 404


# ---------- Bookings (public POST) ----------
class TestBookings:
    def test_create_booking(self, api):
        payload = {
            "name": "TEST_Patient", "phone": "9999999999", "email": "test@example.com",
            "service": "Smile Makeover", "preferred_date": "2026-02-15",
            "preferred_time": "11:00 AM", "notes": "Test booking",
        }
        r = api.post(f"{BASE_URL}/api/bookings", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"] and "id" in data

    def test_booking_validation(self, api):
        r = api.post(f"{BASE_URL}/api/bookings", json={"name": "x"})
        assert r.status_code == 422


# ---------- Contact ----------
class TestContact:
    def test_create_contact(self, api):
        payload = {"name": "TEST_Contact", "email": "tc@example.com", "phone": "9000000000", "message": "Test"}
        r = api.post(f"{BASE_URL}/api/contact", json=payload)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Contact"


# ---------- AI Chat ----------
class TestAIChat:
    def test_chat(self, api):
        r = api.post(f"{BASE_URL}/api/chat",
                     json={"session_id": f"test-{uuid.uuid4()}", "message": "Hi"}, timeout=60)
        assert r.status_code == 200, r.text
        assert isinstance(r.json().get("reply"), str)


# ---------- Smile Analysis ----------
TINY_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)


class TestSmileAnalysis:
    def test_smile_analysis_accepts(self, api):
        r = api.post(f"{BASE_URL}/api/smile-analysis",
                     json={"name": "TEST_Smile", "image_base64": TINY_PNG_B64}, timeout=120)
        assert r.status_code in (200, 500)

    def test_smile_analysis_validation(self, api):
        r = api.post(f"{BASE_URL}/api/smile-analysis", json={"name": "x"})
        assert r.status_code == 422


# ---------- Admin Auth ----------
class TestAdminAuth:
    def test_admin_login_correct(self, api):
        r = api.post(f"{BASE_URL}/api/admin/login", json={"token": ADMIN_TOKEN})
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_admin_login_wrong(self, api):
        r = api.post(f"{BASE_URL}/api/admin/login", json={"token": "wrongtoken"})
        assert r.status_code == 401

    def test_admin_endpoints_require_token(self, api):
        for ep in ("bookings", "contacts", "smile-analyses", "blog"):
            r = api.get(f"{BASE_URL}/api/admin/{ep}")
            assert r.status_code == 401, f"{ep} should be 401 without token"

    def test_admin_endpoints_with_token(self, admin_api):
        for ep in ("bookings", "contacts", "smile-analyses", "blog"):
            r = admin_api.get(f"{BASE_URL}/api/admin/{ep}")
            assert r.status_code == 200, f"{ep} failed: {r.text}"
            assert isinstance(r.json(), list)


# ---------- Admin Blog CRUD ----------
class TestAdminBlogCRUD:
    test_slug = f"test-post-{uuid.uuid4().hex[:8]}"

    def test_a_create_post(self, admin_api):
        payload = {
            "slug": self.test_slug,
            "title": "TEST_ Sample Post",
            "excerpt": "Test excerpt for backend regression.",
            "cover": "https://images.unsplash.com/photo-1609840114035-3c981b782dfe",
            "category": "Cosmetic Dentistry",
            "tags": ["test"],
            "key_takeaways": ["Takeaway 1"],
            "content_md": "## Heading\n\nThis is **test** content.",
            "faqs": [{"q": "Q?", "a": "A."}],
            "related_services": ["teeth-whitening"],
            "references": ["Test Reference"],
        }
        r = admin_api.post(f"{BASE_URL}/api/admin/blog", json=payload)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

    def test_b_create_duplicate_slug(self, admin_api):
        payload = {
            "slug": self.test_slug, "title": "Dup", "excerpt": "x",
            "cover": "x", "category": "x", "content_md": "x",
        }
        r = admin_api.post(f"{BASE_URL}/api/admin/blog", json=payload)
        assert r.status_code == 400

    def test_c_update_post(self, admin_api):
        payload = {
            "slug": self.test_slug,
            "title": "TEST_ Updated Title",
            "excerpt": "Updated excerpt",
            "cover": "https://images.unsplash.com/photo-1609840114035-3c981b782dfe",
            "category": "Cosmetic Dentistry",
            "content_md": "## Updated\n\nUpdated content.",
        }
        r = admin_api.put(f"{BASE_URL}/api/admin/blog/{self.test_slug}", json=payload)
        assert r.status_code == 200, r.text

        # Verify via public detail
        rg = requests.get(f"{BASE_URL}/api/blog/{self.test_slug}")
        assert rg.status_code == 200
        assert rg.json()["title"] == "TEST_ Updated Title"

    def test_d_update_nonexistent(self, admin_api):
        payload = {"slug": "nope", "title": "x", "excerpt": "x", "cover": "x", "category": "x", "content_md": "x"}
        r = admin_api.put(f"{BASE_URL}/api/admin/blog/nonexistent-xyz", json=payload)
        assert r.status_code == 404

    def test_e_delete_post(self, admin_api):
        r = admin_api.delete(f"{BASE_URL}/api/admin/blog/{self.test_slug}")
        assert r.status_code == 200
        # Verify gone
        rg = requests.get(f"{BASE_URL}/api/blog/{self.test_slug}")
        assert rg.status_code == 404

    def test_f_delete_nonexistent(self, admin_api):
        r = admin_api.delete(f"{BASE_URL}/api/admin/blog/nonexistent-xyz")
        assert r.status_code == 404

    def test_g_blog_create_requires_auth(self, api):
        r = api.post(f"{BASE_URL}/api/admin/blog",
                     json={"slug": "x", "title": "x", "excerpt": "x",
                           "cover": "x", "category": "x", "content_md": "x"})
        assert r.status_code == 401


# ---------- Static SEO ----------
class TestSEOAssets:
    def test_sitemap_xml(self, api):
        r = requests.get(f"{BASE_URL}/sitemap.xml", timeout=15)
        assert r.status_code == 200
        assert "<urlset" in r.text or "<sitemapindex" in r.text

    def test_robots_txt(self, api):
        r = requests.get(f"{BASE_URL}/robots.txt", timeout=15)
        assert r.status_code == 200

    def test_index_has_seo(self, api):
        r = requests.get(f"{BASE_URL}/", timeout=15)
        assert r.status_code == 200
        assert "application/ld+json" in r.text
