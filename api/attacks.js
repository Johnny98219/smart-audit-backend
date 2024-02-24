const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const fetchAttacks = require('../scrapers/slowmist');
const supabase = require('../lib/supabase');
const { readCache, writeCache } = require('../lib/file');

async function fetchAttackStats() {
  console.log('Fetching attack stats');

  try {
    const { count: totalAttacks, error: totalError } = await supabase
      .from('attacks')
      .select('id', { count: 'exact' });

    if (totalError) throw totalError;

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('attacks')
      .select('attack_vector');

    if (categoriesError) throw categoriesError;

    const categoryCounts = {};

    categoriesData.forEach(row => {
      const category = row.attack_vector;
      if (category in categoryCounts) {
        categoryCounts[category]++;
      } else {
        categoryCounts[category] = 1;
      }
    });

    const uniqueCategories = Object.keys(categoryCounts).map(category => ({
      name: category,
      count: categoryCounts[category],
    }));

    let filteredCategories = uniqueCategories.filter(
      category => category.count > 5
    );

    filteredCategories = filteredCategories.sort((a, b) => b.count - a.count);

    const { data: attackAmounts, error: attacksError } = await supabase
      .from('attacks')
      .select('amount');

    let total_amount = 0;
    let fixed_amounts = 0;
    for (let i = 0; i < attackAmounts.length; i++) {
      current_amount = attackAmounts[i].amount;

      const nonNumericRegex = /\D/;

      if (nonNumericRegex.test(current_amount)) {
        if (current_amount.includes('USD')) {
          chunks = current_amount.split(' ')[0];
          if (chunks.length == 2) {
            current_amount = chunks[0];
            fixed_amounts += parseFloat(current_amount, 10);
          } else {
            current_amount = 0;
          }
        } else if (current_amount.includes('$')) {
          current_amount = current_amount
            .replace('$', '')
            .replace(/,/g, '')
            .replace(/ /g, '');
          fixed_amounts += parseFloat(current_amount, 10);
        } else if (current_amount === '-') {
          current_amount = 0;
        } else {
          current_amount = 0;
        }
      }

      total_amount += parseFloat(current_amount, 10);
    }

    total_amount += 20000000000.12; // Hack to add the non-USD amounts

    console.log('Total Attacks:', totalAttacks);
    // console.log('Unique Categories:', filteredCategories);
    console.log('Total Amount:', total_amount);

    let filename = `./cache/attacks.json`;
    await writeCache(filename, {
      total: totalAttacks,
      categories: filteredCategories,
      total_amount: total_amount,
    });
  } catch (error) {
    console.error('Error fetching attack stats:', error);
  }
}

router.get('/stats', async (req, res) => {
  let filename = `./cache/attacks.json`;
  let filedata = await readCache(filename);
  res.status(200).send(filedata);
});

async function init() {
  const base_url = 'https://hacked.slowmist.io';
  await fetchAttacks(base_url);
  await fetchAttackStats();

  console.log(`Attacks: setting up cron job to run every 1 hour`);
  cron.schedule('0 * * * *', () => {
    fetchAttacks(base_url);
    fetchAttackStats();
  });
}

module.exports = { router, init };
