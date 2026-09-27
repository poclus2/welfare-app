fetch('http://localhost:9000/store/product-categories', {
  headers: {
    'x-publishable-api-key': 'pk_ab69509b552608466b0439ef9155da18afdbba17c4ceb702ec8c9eb4ff025736'
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
