const { Module } = require("module");

function rankByScore(jsonList) {
    return jsonList.sort((a, b) => b.final_score - a.final_score);
}

function run_rank(criticOutputList) {
    let strategy ="default"


        for (let i = 0; i < criticOutputList.length; i++) {
            const bugInfo = criticOutputList[i];
            const correctness = parseFloat(bugInfo.correctness);
            const severity = parseFloat(bugInfo.severity);
            const profitability = parseFloat(bugInfo.profitability);

            let finalScore;
            if (strategy === 'default') {
                finalScore = 0.5 * correctness + 0.25 * severity + 0.25 * profitability;
            } else if (strategy === 'customize') {
                // TODO: add your scoring function
            } else {
                throw new Error('Please choose correct strategy for scoring...');
            }

            bugInfo.final_score = finalScore;
            bugInfo['mitigation'] = bugInfo.reason;
            bugInfo['title'] = bugInfo.vulnerability;
            bugInfo['severity'] = 'INFO';

            if (bugInfo.final_score > 5 && bugInfo.final_score < 8 && bugInfo.profitability > 3 && bugInfo.profitability < 7) {
                bugInfo.severity = 'LOW';
            } else if (bugInfo.final_score > 8 && bugInfo.profitability > 7) {
                bugInfo.severity = 'MEDIUM';
            }
        }

        const rankerOutputList = rankByScore(criticOutputList);



    console.log('Ranking finished...');
    return rankerOutputList;
}
module.exports = { run_rank };