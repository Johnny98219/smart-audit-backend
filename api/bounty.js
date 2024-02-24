const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const fetchBounties = require('../scrapers/solidit');
const supabase = require('../lib/supabase');
const { readCache, writeCache } = require('../lib/file');

async function fetchBountyStats() {
  console.log('Fetching bounty stats');

  try {
    const { count: totalBounties, error: totalError } = await supabase
      .from('bounties')
      .select('id', { count: 'exact' });

    if (totalError) throw totalError;

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('bounties')
      .select('category_list');

    if (categoriesError) throw categoriesError;

    const uniqueCategories = [
      ...new Set(categoriesData.flatMap(cat => cat.category_list)),
    ];

    const {
      data: [maxValues],
      error: maxError,
    } = await supabase
      .from('bounties')
      .select('total_paid_amount, max_reward')
      .order('total_paid_amount', { ascending: false })
      .order('max_reward', { ascending: false })
      .limit(1);

    if (maxError) throw maxError;

    console.log('Total Bounties:', totalBounties);
    console.log('Unique Categories:', uniqueCategories);
    console.log('Max Total Paid Amount:', maxValues.total_paid_amount);
    console.log('Max Reward:', maxValues.max_reward);

    let filename = `./cache/bounty.json`;
    await writeCache(filename, {
      total: totalBounties,
      categories: uniqueCategories,
      max_reward: maxValues.max_reward,
      max_paid: maxValues.total_paid_amount,
    });
  } catch (error) {
    console.error('Error fetching bounty stats:', error);
  }
}

router.get('/stats', async (req, res) => {
  let filename = `./cache/bounty.json`;
  let filedata = await readCache(filename);
  res.status(200).send(filedata);
});

async function init() {
  await fetchBounties(2);
  await fetchBountyStats();

  console.log(`Bounty: setting up cron job to run every 1 hour`);
  cron.schedule('0 * * * *', () => {
    fetchBounties(1);
    fetchBountyStats();
  });
}

module.exports = { router, init };
