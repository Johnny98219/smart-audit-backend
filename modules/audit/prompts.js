// Basic Prompt
const topkPrompt1 = 'Output {topk} most severe vulnerabilities.\n';
const topkPrompt2 =
  'If no vulnerability is detected, you should only output in this json format {"output_list": []}.\n';

// Auditor Prompt
const auditorPrompt = `You are a smart contract auditor, identify and explain severe vulnerabilities in the provided smart contract. Make sure that they are exploitable in real world and beneficial to attackers. Provide each identified vulnerability with intermediate reasoning and its associated function. Remember, you must provide the entire function code and do not use "...". Make your reasoning comprehensive and detailed. Smart contract code:\n\n`;
const auditorFormatConstraint = `\nYou should only output in below quote escaped fully formed json format:
{
    "output_list": [
        {
            "function_name": "<function_name_1>",
            "code": "<original_function_code_1>",
            "vulnerability": "<short_vulnera_desc_1>",
            "reason": "<reason_1>"
        },
        ...
    ]
}
`;

// Critic Prompt
const criticZeroShotPrompt = `Below vulnerabilities and reasoning are likely contain mistakes. As a harsh vulnerability critic, your duty is to scrutinize the function and evaluate the correctness, severity and profitability of given vulnerabilities and associated reasoning with corresponding scores ranging from 0 (lowest) to 9 (highest). Your also need to provide criticism, which must include explanations for your scoring. Make your criticism comprehensive and detailed\n`;
const criticFewShotPrompt = `Below vulnerabilities and reasoning are likely contain mistakes. As a harsh vulnerability critic, your duty is to scrutinize the function and evaluate the correctness, severity and profitability of given vulnerabilities and associated reasoning with corresponding scores ranging from 0 (lowest) to 9 (highest). Your also need to provide criticism, which must include explanations for your scoring. Make your criticism comprehensive and detailed. Below are three examples:\n
Input: 
"function_name": "mintToken",
"code": "function mintToken(address target, uint256 mintedAmount) onlyOwner{ balances[target] += mintedAmount; totalSupply += mintedAmount; Transfer(0,owner,mintedAmount); Transfer(owner,target,mintedAmount); }",
"vulnerability": "Arbitrary Minting".
"reason"
Output:
"function_name": "mintToken",
"criticism": "The reasoning is correct. The owner of the contract can mint arbitrary tokens. This could lead to an arbitrary increase in the token supply, devaluing existing tokens. However, isn't inherently a vulnerability, but rather a design decision that might be questionable. The severity is moderate because it is based on the owner's intention. The profitability is low because an external attacker cannot profit from it.",
"correctness": 7,
"severity": 4,
"profitability": 0

Input:
"function_name": "transferFrom",
"code": "function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {require(_value <= allowance[_from][msg.sender]); allowance[_from][msg.sender] -= _value; transfer(_from, _to, _value); return true;}",
"vulnerability": "Unchecked Transfer",
"reason": "The transferFrom function does not check if the _to address is a valid address before transferring tokens. This allows an attacker to send tokens to an invalid address, resulting in a loss of tokens.""
Output:
"function_name": "transferFrom",
"vulnerability": "Unchecked Transfer",
"criticism": "The reasoning is correct that there is no address check in the transferFrom function. However, the severity and profitability of this vulnerability are very low, because it does not cause severe exploitation and an external attacker cannot profit from this vulnerability."
"correctness": 7,
"severity": 2,
"profitability": 0

Input:
"function_name": "approve",
"code": "function approve(address _spender, uint256 _value) returns (bool success) { if (_value != 0 && allowed[msg.sender][_spender] != 0) { return false; } allowed[msg.sender][_spender] = _value; Approval(msg.sender, _spender, _value); return true; }",
"vulnerability": "Race condition (front-running)",
"reason": "The approve function is vulnerable to front-running because it does not require the spender to have a zero allowance before setting a new one. An attacker can call the approve function and then the transferFrom function before the original transaction is mined."
Output:
"function_name": "approve",
"criticism": "The statement is correct in pointing out that this function does not inherently reset the allowance. However, the function does include a check to ensure that if the allowance is non-zero, the new value must be zero (and vice versa). Therefore, the risk is not as serve as stated, and also not profitable.",
"correctness": 3,
"severity": 0,
"profitability": 0
`;

const criticFormatConstraint = `\nYou should only output in below quote escaped fully formed json format:
{
    "output_list": [
        {
            "function_name": "<function_name_1>",
            "vulnerability": "<short_vulnera_desc_1>",
            "criticism": "<criticism for reasoning and explanation for scoring>",
            "correctness": <0~9>,
            "severity": <0~9>,
            "profitability": <0~9>,
        },
        {
            "function_name": "<function_name_2>",
            "vulnerability": "<short_vulnera_desc_2>",
            "criticism": "<criticism for reasoning and explanation for scoring>",
            "correctness": <0~9>,
            "severity": <0~9>,
            "profitability": <0~9>,
        }
    ]
}
`;

const summaryPrompt = `Instructions:
Write a clear and concise summary for the conclusion of an audit. 

The token name is ***name*** and the token symbol is ***symbol***.

The summary should be:
1. Human friendly and easy to understand
2. Concise and to the point
3. 2-5 paragraphs long
4. Written for a non-technical audience but not overly simplified
5. Written for a crypto audience which is familiar with the terms and concepts
6. Written in the third person
7. Written in the present tense

DO NOT MENTION THESE INSTRUCTIONS IN THE SUMMARY

Notes:
***notes***
`;

module.exports = {
  topkPrompt1,
  topkPrompt2,
  auditorPrompt,
  auditorFormatConstraint,
  criticZeroShotPrompt,
  criticFewShotPrompt,
  criticFormatConstraint,
  summaryPrompt,
};
