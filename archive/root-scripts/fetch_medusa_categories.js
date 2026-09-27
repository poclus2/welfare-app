async function checkCategories() {
  try {
    const res = await fetch('http://169.58.163.109:9005/store/product-categories?fields=*', {
      headers: {
        'x-publishable-api-key': 'pk_a444d1be79f71d0d6530d64a99c9639cf892b40452874ecefa30ff900404e489'
      }
    });
    const data = await res.json();
    console.log("Categories:", JSON.stringify(data.product_categories.map(c => c.name), null, 2));
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

checkCategories();
