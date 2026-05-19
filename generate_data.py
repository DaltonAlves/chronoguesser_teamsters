import json
import random
import requests

# Curated seeds across BOTH collections (5184 and 4719)
SEEDS = [
    
    # --- Collection 4719: Teamsters Labor History Archive ---
    {"url": "teamster.org", "name": "Teamsters National Homepage", "collection": 4719},
]

def fetch_and_build_db():
    compiled_problems = []
    
    print("🛰️ Connecting to Archive-It Clusters...")
    
    for seed in SEEDS:
        coll_id = seed["collection"]
        print(f" -> Querying Collection {coll_id} Index for: {seed['name']}...")
        
        # Dynamically inject the correct collection number into the timemap query
        api_url = f"https://wayback.archive-it.org/{coll_id}/timemap/cdx?url={seed['url']}&filter=statuscode:200&filter=mimetype:text/html"
        
        try:
            response = requests.get(api_url, timeout=15)
            
            if response.status_code != 200:
                print(f"    ⚠️ Warning: Skipped {seed['url']} (Status {response.status_code})")
                continue
                
            raw_text = response.text.strip()
            if not raw_text:
                print(f"    ⚠️ Warning: Index empty for {seed['url']}.")
                continue
                
            lines = raw_text.split("\n")
            
            valid_snapshots = []
            for line in lines:
                parts = line.split(" ")
                if len(parts) >= 3:
                    valid_snapshots.append(parts)
            
            if not valid_snapshots:
                continue
                
            # Grab up to 50 random history dates per target seed
            sample_size = min(len(valid_snapshots), 50)
            selected_snapshots = random.sample(valid_snapshots, sample_size)
            
            for chunks in selected_snapshots:
                timestamp = chunks[1]      
                original_url = chunks[2]   
                year = int(timestamp[:4])  
                
                # Format the problem, inserting the dynamic collection ID 
                # so the iframe points to the exact right archival mirror
                compiled_problems.append({
                    "name": seed["name"],
                    "year": year,
                    "displayUrl": original_url, # Added to track the exact historic URL
                    "iframeUrl": f"https://wayback.archive-it.org/{coll_id}/{timestamp}/{original_url}"
                })
                
        except Exception as e:
            print(f"    ❌ Error compiling logs for {seed['url']}: {e}")
            
    with open("gamedata.json", "w") as f:
        json.dump(compiled_problems, f, indent=2)
        
    print(f"\n🎉 Success! Combined database generated with {len(compiled_problems)} levels.")

if __name__ == "__main__":
    fetch_and_build_db()