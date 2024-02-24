const supabase = require('./lib/supabase');
const fs = require('fs');
const { readCache } = require('./lib/file');
const { insertRequestdb } = require('./lib/utils');
const generatePDF = require('./modules/report/generate');
// const { Octokit } = require('@octokit/rest');

// const octokit = new Octokit({
//   auth: process.env.GITHUB_TOKEN,
// });

// const owner = 'AslamSDM';
// const repo = 'test-repo';

async function modifyreportRequestdb(address, status, name, image_url) {
  try {
    const { data, error } = await supabase
      .from('report_requests')
      .update({ status: status, name: name, image_url: image_url })
      .eq('address', address);
    if (error) {
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error('Error updating data in Supabase:', error);
    return [];
  }
}
// Fetch data from Supabase table

async function fetchDataFromTable() {
  try {
    const { data, error } = await supabase
      .from('report_requests')
      .select('*')
      .eq('status', 'requested');
    if (error) {
      //   throw new Error(error.message);
      return [];
    }
    return data;
  } catch (error) {
    console.error('Error fetching data from Supabase:', error);
    return [];
  }
}
async function pushToGithub(address) {
  try {
    // Get the SHA of the file
    let sha = null;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: `pdf/${address}.pdf`,
      });
      sha = data.sha;
      console.log('sha', sha);
    } catch (error) {
      console.log('error', error);
    }
    const file = fs.readFileSync(`./modules/report/pdf/${address}.pdf`);
    const content = file.toString('base64');
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `pdf/${address}.pdf`,
      message: `Add report for ${address}`,
      content,
      sha,
    });

    console.log(response.data.content.html_url);
    return response.data.content.html_url;
  } catch (error) {
    console.error('Error while pushing to GitHub:', error);
  }
}

const getName = async address => {
  const filePath = `./cache/contracts/${address}/meta.json`;
  try {
    const meta = await readCache(filePath);
    const info = meta?.tokens[0];
    const name = info?.symbol;
    const image_url = info?.imageSmallUrl;
    // Use the name variable here
    console.log('Name:', name);
    console.log('Image URL:', image_url);
    return { name, image_url };
  } catch (error) {
    console.error('Error reading info.json:', error);
    return address;
  }
};

async function reportWorker() {
  const requests = await fetchDataFromTable();
  if (requests?.length === 0) {
    // console.log('No requests found');
    return;
  }
  for (const row of requests) {
    const address = row.address;
    console.log('Processing: ', address, row.status);
    try {
      if (row.status === 'requested') {
        const { data: auditRequests, error: error_req } = await supabase
          .from('audit_requests')
          .select('*')
          .eq('contract', address);

        if (error_req) {
          console.log('Error fetching audit request:', error_req);
          continue;
        } else if (auditRequests.length === 0) {
          // Create a new audit request

          console.log('No audit request found for the given address');

          await insertRequestdb({ contract: address, status: 'pending' });
          console.log('-- created audit request');
          continue;
        } else {
          // Found an audit request
          const auditRequest = auditRequests[0];
          console.log(`Audit Status: ${auditRequest.status}`);

          // Check if audit request is completed
          if (auditRequest.status === 'completed') {
            const { name, image_url } = await getName(address);

            await generatePDF(address, name).then(() =>
              console.log('Generated PDF')
            );
            console.log('-- generated pdf ', name, '.pdf');

            // while loop to wait for the file to be generated
            while (!fs.existsSync(`./cache/reports/${address}/${name}.pdf`)) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            await modifyreportRequestdb(address, 'completed', name, image_url);

            console.log('-- pushed to supabase');
          } else {
            // Wait for audit request to complete
            console.log('Audit request is not completed');
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error while processing: ', address, error);
      modifyreportRequestdb(address, 'failed');
      console.log('-- modified status to failed');
    }
  }
}

const runReportWorker = async () => {
  while (true) {
    await reportWorker();
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
};

runReportWorker();
// generatePDF("0x514910771AF9Ca656af840dff83E8264EcF986CA");
