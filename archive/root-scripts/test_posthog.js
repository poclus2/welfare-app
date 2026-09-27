fetch('https://us.posthog.com/api/projects/616113/query/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ***REMOVED-POSTHOG-PERSONAL-KEY***',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "query": {
      "kind": "HogQLQuery",
      "query": "SELECT properties.$geoip_country_name, count() FROM events WHERE event = '$pageview' AND timestamp > today() - INTERVAL 30 DAY GROUP BY properties.$geoip_country_name ORDER BY count() DESC LIMIT 10"
    }
  })
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
