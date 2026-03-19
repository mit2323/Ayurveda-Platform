"""URL-safe slug generation utilities."""
import re
import uuid


def slugify(text: str) -> str:
    """Convert text to a URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


async def generate_unique_slug(name: str, repo) -> str:
    """
    Generate a unique slug for a product/category.
    Appends a short UUID suffix if the base slug already exists.
    """
    base_slug = slugify(name)
    slug = base_slug

    # Check uniqueness — try up to 5 times with different suffixes
    for attempt in range(5):
        existing = await repo.get_by_slug(slug)
        if not existing:
            return slug
        suffix = uuid.uuid4().hex[:6]
        slug = f"{base_slug}-{suffix}"

    # Fallback: full UUID
    return f"{base_slug}-{uuid.uuid4().hex[:8]}"