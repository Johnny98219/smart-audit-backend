const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const supabase = require('../lib/supabase');

async function fetchAttacks(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const hackEvents = [];

    $('.case-content ul li').each(function () {
      const li = $(this).clone();
      li.find('em').remove();

      let date = li.find('.time').text();
      let target = li.find('h3').text().trim();
      let description = li.find('p').eq(0).text().trim();
      let amount = li.find('p').eq(1).find('span').eq(0).text().trim();
      let attack_vector = li.find('p').eq(1).find('span').eq(1).text().trim();
      let reference = li.find('a').attr('href');

      date = new Date(date);

      description = description
        .replace('Slowmist ', '')
        .replace('slowmist ', '')
        .replace('SlowMist ', '');

      // amount = amount.replace('$ ', '').replace(/,/g, '').replace('-', '0');

      attack_vector = attack_vector.replace(' was hacked', '').trim();

      const dataString = `${date}${target}${description}${amount}${attack_vector}${reference}`;
      const hash = crypto.createHash('md5').update(dataString).digest('hex');

      hackEvents.push({
        date,
        target,
        description,
        amount,
        attack_vector,
        reference,
        hash,
      });
    });

    let totalPagesText = $('.pagination').find('li').eq(2).text().trim();
    totalPagesText = totalPagesText.replace('Page ', '').replace(' of ', ' ');
    totalPages = parseInt(totalPagesText.split(' ')[1], 10);
    console.log(`Attacks: Total pages: ${totalPages}`);

    return { hackEvents, pages: totalPages };
  } catch (error) {
    console.error(error);
    return { hackEvents: [], $: null };
  }
}

async function fetchPages() {
  const baseURL = 'https://hacked.slowmist.io';
  let currentPage = 1;
  let totalPages = null;

  try {
    while (totalPages === null || currentPage <= totalPages) {
      const pageURL = `${baseURL}?page=${currentPage}`;

      console.log(`Attacks: Scraping page: ${currentPage}`);
      const { hackEvents, pages } = await fetchAttacks(pageURL);

      addToDatabase(hackEvents);

      if (totalPages === null) {
        totalPages = pages;
        console.log(`Attacks: Total pages: ${totalPages}`);
      }

      currentPage++;
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function addToDatabase(items) {
  try {
    const { error } = await supabase.from('attacks').upsert(items);

    if (error) {
      if (error.code === '23505') {
        console.log('Duplicate hash encountered, skipping insert.');
      } else {
        throw error;
      }
    }

    console.log(
      `Attacks: Bulk upsert completed. Items processed: ${items.length}`
    );
  } catch (error) {
    console.error('Attacks: Error in bulk upsert:', error);
  }
}

if (require.main === module) {
  fetchPages()
    .then(() => console.log('Attacks: Data fetching completed.'))
    .catch(err =>
      console.error('Attacks: Data fetching encountered an error:', err)
    );
} else {
  module.exports = fetchAttacks;
}
