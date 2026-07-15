<img width="1429" height="898" alt="image" src="https://github.com/user-attachments/assets/8ea866fc-b430-4e2d-b23e-7f6fa414e922" />


# Retention Reactor: DTC Analytics Lab

Retention Reactor is an interactive analytics dashboard for a simulated direct-to-consumer subscription business. It helps show where customers drop off, which groups are more likely to buy again, and how discounting affects revenue and repeat purchases.

Live app: https://retentionreactorsqllabs.com  
Repository: https://github.com/cdsapp01110/Retention-Reactor

## About the project

This is a portfolio case study built around customer, order, and website activity data. The goal was to turn that data into something easy to explore.

The app looks at customer retention, shopping behavior, revenue, and acquisition performance. It can help answer questions such as where customers leave the buying process, which marketing channels bring stronger customers, and whether discounts are helping or hurting long-term results.

All data in the app is simulated. It is for educational and portfolio use.

## Dashboard pages

The Overview page gives a quick look at how the business is performing. It includes customer count, orders, net revenue, average order value, conversion rate, repeat rate, and suggested next steps. It also points out the biggest drop-off in the funnel and compares full-price customers with customers who used discounts.

The Cohort Lab groups customers by signup month or first purchase month. It shows retention over time through monthly heatmaps and charts. You can inspect a cohort's size, revenue, channel mix, and funnel activity.

Cohort Lab: https://retentionreactorsqllabs.com/cohorts

The Funnel Lab follows the customer journey from visit to product view, add to cart, checkout, and purchase. It shows conversion rates and drop-off at each stage. The data can be viewed by marketing channel, device, region, discount use, or customer cohort.

Funnel Lab: https://retentionreactorsqllabs.com/funnel

The Revenue Lab looks at sales quality. It compares gross revenue, net revenue, average order value, estimated margin, discount amounts, and repeat purchase behavior. This makes it easier to see whether a discount is bringing in customers who return or customers who only buy once.

Revenue Lab: https://retentionreactorsqllabs.com/revenue

The Segment Explorer compares results by channel, device, and region. Each group is scored using conversion, retention, customer value, revenue, margin, and discount use. Groups are labeled as Retention Outlier, High Value, Stable, Funnel Risk, or Discount Risk.

Segment Explorer: https://retentionreactorsqllabs.com/segments

The Recommendations page turns the dashboard data into practical suggestions. Depending on the selected filters, it may point to weak checkout performance, heavy discount use, a strong acquisition channel, or a region that needs a closer look.

Recommendations: https://retentionreactorsqllabs.com/recommendations

The SQL Logic page explains the thinking behind the numbers. It covers cohort retention, funnel conversion, customer segments, revenue calculations, discount impact, and repeat purchase metrics. The app uses a star-schema-style data model built from customer, product, channel, campaign, region, event, and order data.

SQL Logic: https://retentionreactorsqllabs.com/sql

## Filters

Most pages share the same filters. You can narrow the data by region, acquisition channel, device type, discount use, cohort type, or dashboard mode.

For example, you can look at mobile customers from paid search who used a discount, then check how that group performs across the funnel, retention charts, revenue views, and recommendations.

## Built with

Retention Reactor was built with React, Vite, React Router, TanStack Query, Recharts, Tailwind CSS, Radix UI, Lucide Icons, and Base44.

## Why I built it

I built this project to show how retention and conversion data can be turned into a useful product analytics experience. The focus is on asking practical business questions and giving people a clear way to explore the answers.

## Links

Live application: https://retentionreactorsqllabs.com  
GitHub repository: https://github.com/cdsapp01110/Retention-Reactor  
Cohort Lab: https://retentionreactorsqllabs.com/cohorts  
Funnel Lab: https://retentionreactorsqllabs.com/funnel  
Revenue Lab: https://retentionreactorsqllabs.com/revenue  
Segment Explorer: https://retentionreactorsqllabs.com/segments  
SQL Logic: https://retentionreactorsqllabs.com/sql

## Note

The customer, event, order, revenue, and campaign data in this project is simulated. It does not represent a real company.
