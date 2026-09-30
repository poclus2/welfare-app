import { NextResponse } from 'next/server';

export async function GET() {
  const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
  const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "616113";

  if (!POSTHOG_API_KEY) {
    return NextResponse.json({ error: "POSTHOG_PERSONAL_API_KEY is not configured" }, { status: 500 });
  }
  
  async function runHogQL(query: string) {
    const res = await fetch(`https://us.posthog.com/api/projects/${PROJECT_ID}/query/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTHOG_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "query": { "kind": "HogQLQuery", "query": query }
      }),
      // Revalidate every 5 minutes
      next: { revalidate: 300 }
    });
    
    if (!res.ok) {
      console.error("PostHog API Error:", await res.text());
      return [];
    }
    const data = await res.json();
    return data.results || [];
  }

  try {
    // 1. Total pageviews and unique visitors in last 30 days
    const stats30d = await runHogQL(`
      SELECT 
        count(), 
        count(DISTINCT distinct_id) 
      FROM events 
      WHERE event = '$pageview' AND timestamp > today() - INTERVAL 30 DAY
    `);

    // 2. Traffic over the last 7 days
    const traffic7d = await runHogQL(`
      SELECT 
        toDate(timestamp) as day, 
        count() 
      FROM events 
      WHERE event = '$pageview' AND timestamp > today() - INTERVAL 7 DAY 
      GROUP BY day 
      ORDER BY day ASC
    `);

    // 3. Device types
    const deviceStats = await runHogQL(`
      SELECT 
        properties.$device_type, 
        count() 
      FROM events 
      WHERE event = '$pageview' AND timestamp > today() - INTERVAL 30 DAY
      GROUP BY properties.$device_type
    `);

    // 4. Locations (Countries)
    const locationStats = await runHogQL(`
      SELECT 
        properties.$geoip_country_name, 
        count() 
      FROM events 
      WHERE event = '$pageview' AND timestamp > today() - INTERVAL 30 DAY
      GROUP BY properties.$geoip_country_name
      ORDER BY count() DESC
      LIMIT 10
    `);

    const pageviews = stats30d[0]?.[0] || 0;
    const uniqueVisitors = stats30d[0]?.[1] || 0;

    const daysMap = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const trafficData = traffic7d.map((row: any) => {
      const date = new Date(row[0]);
      return {
        name: daysMap[date.getDay()],
        visits: row[1],
        bounce: 0 // Mock bounce rate for now
      };
    });

    const deviceMap: any = {
      "Mobile": { color: '#C08A8E' },
      "Desktop": { color: '#2A2424' },
      "Tablet": { color: '#EDE0E0' }
    };

    let totalDevices = 0;
    deviceStats.forEach((r: any) => totalDevices += r[1]);

    const deviceData = deviceStats.map((row: any) => {
      const type = row[0] || 'Desktop';
      const count = row[1];
      const pct = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
      return {
        name: type,
        value: pct,
        color: deviceMap[type]?.color || '#999'
      };
    });

    // Locations Data Processing
    let totalVisitsForLocation = 0;
    locationStats.forEach((r: any) => totalVisitsForLocation += r[1]);

    const regionData = locationStats.map((row: any) => {
      const country = row[0] || 'Inconnu';
      const count = row[1];
      const pct = totalVisitsForLocation > 0 ? Math.round((count / totalVisitsForLocation) * 100) : 0;
      return { name: country, value: pct, count };
    });

    // If PostHog has no data at all yet (because it was just fixed), 
    // we return empty states gracefully instead of crashing
    if (trafficData.length === 0) {
      // Mock last 7 days as empty
      for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        trafficData.push({ name: daysMap[d.getDay()], visits: 0, bounce: 0 });
      }
    }

    if (deviceData.length === 0) {
      deviceData.push({ name: 'Desktop', value: 100, color: '#2A2424' });
    }

    return NextResponse.json({
      pageviews,
      uniqueVisitors,
      trafficData,
      deviceData,
      regionData
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
