fetch("http://127.0.0.1:7700/indexes/products/documents", { headers: { "Authorization": "Bearer meilisearch_super_secret" } }).then(r => r.json()).then(console.log)
