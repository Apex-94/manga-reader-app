import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

from app.extensions.mangahere import MangaHere

async def main():
    scraper = MangaHere()
    print(f"Testing {scraper.name}...")

    # Test Popular
    print("\n--- Testing Popular ---")
    try:
        popular = await scraper.popular(page=1)
        print(f"Found {len(popular)} popular items.")
        if popular:
            print(f"Sample: {popular[0]}")
    except Exception as e:
        print(f"Popular failed: {e}")

    # Test Search
    print("\n--- Testing Search 'naruto' ---")
    results = []
    try:
        results = await scraper.search("naruto")
        print(f"Found {len(results)} search results.")
        if results:
            print(f"Sample: {results[0]}")
    except Exception as e:
        print(f"Search failed: {e}")
    
    # Test Details (if we have a result from popular or search)
    manga_url = None
    if popular:
        manga_url = popular[0].url
    elif results:
        manga_url = results[0].url
        
    if manga_url:
        print(f"\n--- Testing Details for {manga_url} ---")
        try:
            details = await scraper.details(manga_url)
            print(f"Title: {details.title}")
            print(f"Chapters: {len(await scraper.chapters(manga_url))}")
        except Exception as e:
            print(f"Details failed: {e}")

    # Test Latest
    print("\n--- Testing Latest ---")
    try:
        latest = await scraper.latest(page=1)
        print(f"Found {len(latest)} latest items.")
        if latest:
            print(f"Sample: {latest[0]}")
    except Exception as e:
        print(f"Latest failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
