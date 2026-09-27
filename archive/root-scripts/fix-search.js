
const http = require("http");

async function fix() {
  const products = await fetch("http://127.0.0.1:9000/store/products?limit=200", {
    headers: { "x-publishable-api-key": "pk_a444d1be79f71d0d6530d64a99c9639cf892b40452874ecefa30ff900404e489" }
  }).then(r => r.json());
  
  console.log("Found", products.products.length);
  
  // Actually, updating them via STORE api is not possible (read only). 
  // We need to use ADMIN api which requires authentication.
}
fix();

