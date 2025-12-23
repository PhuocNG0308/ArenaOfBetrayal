import os
import subprocess
import json
import time
import sys
import shutil
from urllib.parse import urljoin, urlparse, urlunparse
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
REPO_URL = "https://github.com/zama-ai/fhevm.git"
SEED_URLS = [
    "https://docs.zama.org/homepage",
    "https://docs.zama.org/protocol/relayer-sdk-guides",
    "https://docs.zama.org/protocol/solidity-guides",
    "https://docs.zama.org/protocol/examples",
    "https://docs.zama.org/protocol/protocol/overview"
]
BASE_DIR = "docs_context"
REPO_DIR = os.path.join(BASE_DIR, "repo")
MAX_DEPTH = 3
MAX_WORKERS = 5
DELAY = 0.1

def install_dependencies():
    """Install necessary Python packages."""
    packages = ['requests', 'beautifulsoup4', 'markdownify']
    print(f"Installing dependencies: {', '.join(packages)}")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', *packages])

try:
    import requests
    from bs4 import BeautifulSoup
    from markdownify import markdownify as md
except ImportError:
    install_dependencies()
    import requests
    from bs4 import BeautifulSoup
    from markdownify import markdownify as md

def ensure_gitignore():
    """Ensure .gitignore includes the knowledge base files."""
    gitignore_path = ".gitignore"
    entries = ["docs_context/", "manage_zama_knowledge.py"]
    
    if not os.path.exists(gitignore_path):
        with open(gitignore_path, "w") as f:
            f.write("\n".join(entries) + "\n")
        print(f"Created {gitignore_path} with entries.")
        return

    with open(gitignore_path, "r") as f:
        content = f.read()
    
    with open(gitignore_path, "a") as f:
        for entry in entries:
            if entry not in content:
                f.write(f"\n{entry}")
                print(f"Added {entry} to {gitignore_path}")

def fetch_github_repo():
    """Clone or pull the GitHub repository."""
    if os.path.exists(REPO_DIR):
        print(f"Updating repository in {REPO_DIR}...")
        subprocess.run(["git", "-C", REPO_DIR, "pull"], check=True)
    else:
        print(f"Cloning repository to {REPO_DIR}...")
        subprocess.run(["git", "clone", REPO_URL, REPO_DIR], check=True)

class ZamaDocsCrawler:
    def __init__(self, base_dir, seed_urls, max_depth=3):
        self.base_dir = base_dir
        self.seed_urls = seed_urls
        self.max_depth = max_depth
        self.visited = set()
        self.session = requests.Session()
        self.crawled_urls = []

    def normalize_url(self, url):
        parsed = urlparse(url)
        # Remove fragment and query, ensure no trailing slash for consistency
        path = parsed.path
        if path.endswith('/'):
            path = path[:-1]
        clean_url = urlunparse((parsed.scheme, parsed.netloc, path, '', '', ''))
        return clean_url

    def is_valid_url(self, url):
        parsed = urlparse(url)
        return parsed.netloc == "docs.zama.org" and url.startswith("https://")

    def get_local_path(self, url):
        parsed = urlparse(url)
        path = parsed.path.strip('/')
        if not path:
            path = "homepage"
        
        # Map docs.zama.org/path -> docs_context/path.md
        if path.endswith('.html'):
            path = path[:-5]
        
        # Ensure directory exists
        full_path = os.path.join(self.base_dir, path + ".md")
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        return full_path

    def process_url(self, url):
        time.sleep(DELAY)
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                print(f"  [!] Failed {url}: {response.status_code}")
                return [], False

            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Cleanup
            for tag in soup(["script", "style", "nav", "footer", "iframe", "noscript"]):
                tag.decompose()

            # Extract Content
            # Docusaurus usually puts content in <main> or <article>
            content = soup.find('article') or soup.find('main') or soup.body
            
            if not content:
                print(f"  [!] No content found for {url}")
                return [], False

            # Convert to Markdown
            markdown = md(str(content), heading_style="ATX", code_language="bash")
            
            # Save
            local_path = self.get_local_path(url)
            with open(local_path, "w", encoding="utf-8") as f:
                f.write(f"# Source: {url}\n\n")
                f.write(markdown)
            
            print(f"  [+] Saved: {os.path.relpath(local_path)}")
            self.crawled_urls.append(url)

            # Extract Links
            links = set()
            for a in soup.find_all('a', href=True):
                href = a['href']
                if not href: continue
                full_url = urljoin(url, href)
                clean_url = self.normalize_url(full_url)
                
                if self.is_valid_url(clean_url):
                    links.add(clean_url)
            
            return list(links), True

        except Exception as e:
            print(f"  [!] Error {url}: {e}")
            return [], False

    def run(self):
        frontier = set([self.normalize_url(u) for u in self.seed_urls])
        
        for depth in range(self.max_depth + 1):
            print(f"\n--- Depth {depth} (Frontier: {len(frontier)}) ---")
            
            # Filter visited
            to_visit = [u for u in frontier if u not in self.visited]
            if not to_visit:
                print("No new URLs to visit.")
                break
                
            # Mark as visited immediately to prevent re-queueing in same batch
            self.visited.update(to_visit)
            
            next_frontier = set()
            
            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                future_to_url = {executor.submit(self.process_url, url): url for url in to_visit}
                
                for future in as_completed(future_to_url):
                    url = future_to_url[future]
                    try:
                        new_links, success = future.result()
                        if success:
                            next_frontier.update(new_links)
                    except Exception as e:
                        print(f"  [!] Exception processing {url}: {e}")
            
            frontier = next_frontier

def update_last_sync(crawled_urls):
    """Update the last_sync.json file."""
    metadata = {
        "last_sync": time.strftime("%Y-%m-%d %H:%M:%S"),
        "sources": {
            "repo": REPO_URL,
            "crawled_urls_count": len(crawled_urls),
            "crawled_urls": crawled_urls
        }
    }
    with open(os.path.join(BASE_DIR, "last_sync.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"\nUpdated last_sync.json with {len(crawled_urls)} pages.")

def main():
    print("Initializing Recursive Local Knowledge Base for Zama FHEVM...")
    
    # 1. Git Protection
    ensure_gitignore()
    
    # 2. Create Base Directory
    os.makedirs(BASE_DIR, exist_ok=True)
        
    # 3. Fetch GitHub Repo
    try:
        fetch_github_repo()
    except Exception as e:
        print(f"Error fetching repo: {e}")
        
    # 4. Crawl Docs
    crawler = ZamaDocsCrawler(BASE_DIR, SEED_URLS, max_depth=MAX_DEPTH)
    crawler.run()
        
    # 5. Update Metadata
    update_last_sync(crawler.crawled_urls)
    
    print("\nInitialization complete.")
    print("Use 'REFRESH_ZAMA_DOCS' to trigger this update again.")

if __name__ == "__main__":
    main()
