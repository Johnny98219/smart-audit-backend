const express = require('express');
const fs = require('fs');
const router = express.Router();

router.get('/:query', async (req, res) => {
  const q = req.params.query;
  console.log('query', q);

  if (!q || q.length < 2) {
    return res.status(400).send('Bad Request');
  }

  const { CurlImpersonate } = require('node-curl-impersonate');

  const url = `https://io.dexscreener.com/dex/search/v3/pairs?q=${q}`;
  const options = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    impersonate: 'chrome-110',
    verbose: false,
  };

  const curl = new CurlImpersonate(url, options);

  curl
    .makeRequest()
    .then(response => {
      // console.log('Raw Response:', response.response);
      //   console.log('Response Headers:', response.responseHeaders);
      //   console.log('Content Type:', response.responseHeaders['content-type']);
      //   console.log(
      //     'Content Encoding:',
      //     response.responseHeaders['content-encoding']
      //   );

      binary = response.response;

      //   let raw_output = '';

      //   for (let i = 0; i < binary.length; i++) {
      //     let charCode = binary.charCodeAt(i);

      //     raw_output += `0x${charCode
      //       .toString(16)
      //       .padStart(2, '0')}\t${charCode}\t\t${binary[i]}\n`;
      //   }

      //   fs.writeFileSync('test.raw', raw_output);

      function parseBinary(binary) {
        let binaryData = Buffer.isBuffer(binary)
          ? binaryData
          : Buffer.from(binary);

        let processed = [];
        let index = 0;

        function readByte() {
          return binaryData.readUInt8(index++);
        }

        function readInt() {
          let byte = readByte();
          //   console.log('byte:', byte);
          // convert byte to decimal
          let dec = byte.toString(10);
          return dec;
        }

        function readString() {
          let length = readInt();
          length = length / 2;

          //   console.log('strlen:', length);
          let str = '';
          for (let i = 0; i < length; i++) {
            str += String.fromCharCode(readByte());
          }
          return str;
        }

        function readArrayLen() {
          let sizeLength = readByte();
          sizeLength = sizeLength / 2;
          //   console.log('sizeLength:', sizeLength);
          let arrayLength = 0;

          readByte();

          return sizeLength;
        }

        function readToken() {
          const address = readString();
          //   console.log('address:', address);

          const name = readString();
          //   console.log('name:', name);

          const symbol = readString();
          //   console.log('symbol:', symbol);

          return { address, name, symbol };
        }

        function readTransactions() {
          return {
            m5: {
              buys: readInt(),
              sells: readInt(),
            },
            h1: {
              buys: readInt(),
              sells: readInt(),
            },
            h6: {
              buys: readInt(),
              sells: readInt(),
            },
            h24: {
              buys: readInt(),
              sells: readInt(),
            },
          };
        }

        while (index < binaryData.length) {
          // schemaVersion
          let schemaVersion = readString();
          //   processed.push({ schemaVersion });
          //   console.log('schemaVersion:', schemaVersion);

          // PairData
          let arrayLength = 0;
          try {
            arrayLength = readArrayLen();
            //   console.log('results len:', arrayLength);
          } catch (error) {
            break;
          }

          for (let i = 0; i < arrayLength; i++) {
            // console.log(`loop ${i} of ${arrayLength}`);

            let chainId = readString();
            // console.log('chainId:', chainId);

            let dexId = readString();
            // console.log('dexId:', dexId);

            const hasLabel = readByte();
            // console.log('hasLabel:', hasLabel);

            if (hasLabel) {
              const labels = readByte() / 2;
              //   console.log('labels:', labels);

              for (let j = 0; j < labels; j++) {
                const label = readString();
                // console.log('label:', label);
              }
            }

            // const version = readString();
            // console.log('version:', version);

            const pairAddress = readString();
            // console.log('pairAddress:', pairAddress);

            const baseToken = readToken();
            // console.log('baseToken:', baseToken);

            const quoteToken = readToken();
            // console.log('quoteToken:', quoteToken);

            const quoteTokenSymbol = readString();
            // console.log('quoteTokenSymbol:', quoteTokenSymbol);

            const price = readString();
            // console.log('price:', price);

            readByte();

            const priceUsd = readString();

            // const priceArray = readByte() / 2;
            // console.log('priceArray:', priceArray);

            // for (let k = 0; k < priceArray; k++) {
            //   const price = readString();
            //   console.log('priceUsd:', price);
            // }

            // { "hex": "02", "ascii": ".", "decimal": "2" },
            // { "hex": "61", "ascii": "a", "decimal": "97" },

            try {
              let end = false;
              while (!end) {
                let byte = readByte();
                if (byte === 2) {
                  let nextByte = readByte();
                  if (nextByte === 97) {
                    break;
                  }
                }
              }

              const dex_2 = readString();
              // console.log('dex_2:', dex_2);

              readByte();

              if (index < binaryData.length) {
                readByte();
              }
            } catch (error) {
              break;
            }

            processed.push({
              chainId,
              dexId,
              pairAddress,
              baseToken,
              quoteToken,
              quoteTokenSymbol,
              price,
              priceUsd,
            });

            // console.log(`binaryData.length: ${binaryData.length}`);
            // console.log(`index: ${index}`);

            if (index == binaryData.length) {
              break;
            }
          }
        }

        return processed;
      }

      let processed = parseBinary(binary);
      //   console.log(processed);
      //   console.log('a_processed', processed.join('\n'));

      // only return results with chainId == ethereum
      let filtered = processed.filter(item => item.chainId === 'ethereum');

      // sort by priceUsd
      let sorted = filtered.sort((a, b) => {
        return b.priceUsd - a.priceUsd;
      });

      // Reduce to unique baseToken.address
      let unique = sorted.reduce((accumulator, current) => {
        if (
          !accumulator.some(
            item => item.baseToken.address === current.baseToken.address
          )
        ) {
          accumulator.push(current);
        }
        return accumulator;
      }, []);

      res.status(200).send(unique);
    })
    .catch(error => {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    });
});

module.exports = router;
