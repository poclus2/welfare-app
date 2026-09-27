fetch('https://api.thewelfare.store/store/product-categories?limit=100', {
  headers: {
    'x-publishable-api-key': 'pk_a444d1be79f71d0d6530d64a99c9639cf892b40452874ecefa30ff900404e489'
  }
})
.then(res => res.json())
.then(data => {
  if (data.product_categories) {
    data.product_categories.forEach(c => console.log(`Category: ${c.name}, Handle: ${c.handle}`));
  } else {
    console.log(data);
  }
})
.catch(console.error);
