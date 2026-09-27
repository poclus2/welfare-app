fetch('https://api.thewelfare.store/store/product-categories?handle=body-lotion', {
  headers: {
    'x-publishable-api-key': 'pk_a444d1be79f71d0d6530d64a99c9639cf892b40452874ecefa30ff900404e489'
  }
})
.then(res => res.json())
.then(data => {
  console.log(data);
})
.catch(console.error);
