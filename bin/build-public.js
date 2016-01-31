var fs = require('fs');
var nunjucks = require('nunjucks');
var marked = require('marked');
var cp = require('cp');
var Web3 = require('web3');

console.log("Building public content ...");

var contractAddress = "0xa9d160e32ad37ac6f2b8231e4efe14d35abb576e";
var contractAbi = JSON.parse(
  '[{"constant":true,"inputs":[],"name":"currentClaimPrice","outputs":[{"name":"","type":"uint256"}],"type":"function"},' +
  '{"constant":true,"inputs":[],"name":"currentMonarch","outputs":[{"name":"etherAddress","type":"address"},{"name":"name","type":"string"},{"name":"claimPrice","type":"uint256"},{"name":"coronationTimestamp","type":"uint256"}],"type":"function"},' +
  '{"constant":false,"inputs":[{"name":"name","type":"string"}],"name":"claimThrone","outputs":[],"type":"function"},' +
  '{"constant":true,"inputs":[],"name":"numberOfMonarchs","outputs":[{"name":"n","type":"uint256"}],"type":"function"},' +
  '{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"pastMonarchs","outputs":[{"name":"etherAddress","type":"address"},{"name":"name","type":"string"},{"name":"claimPrice","type":"uint256"},{"name":"coronationTimestamp","type":"uint256"}],"type":"function"},' +
  '{"constant":false,"inputs":[],"name":"sweepCommission","outputs":[],"type":"function"},' +
  '{"anonymous":false,"inputs":[{"indexed":false,"name":"usurperEtherAddress","type":"address"},{"indexed":false,"name":"usurperName","type":"string"},{"indexed":false,"name":"newClaimPrice","type":"uint256"}],"name":"ThroneClaimed","type":"event"},' +
  '{"inputs":[],"type":"constructor"}]'
);

var buildTimeWeb3Provider = 'http://localhost:8545';
var clientSideWeb3Provider = 'http://localhost:8545';

console.log("Making sure public dir exists ...");

fs.statSync("public");

console.log("Talking to local Ethereum node to get latest monarchy data ...");

// TODO - allow option of using cached monarchy data if we just want to tweak the wording ...

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(buildTimeWeb3Provider));

if (web3.eth.syncing) {
  throw new Error("your ethereum node is syncing; try later?");
}

// tell web3 how to talk to the contract
var kingOfTheEtherThroneContract = web3.eth.contract(JSON.parse(contractAbiJson));

// tell web3 where the contract is
var kingOfTheEtherThrone = kingOfTheEtherThroneContract.at(contractAddress);

// ask contract what the starting and current claim price is
var startingClaimPrice = web3.fromWei(kingOfTheEtherThrone.startingClaimPrice(),'ether') + ' ether';
var currentClaimPrice = web3.fromWei(kingOfTheEtherThrone.currentClaimPrice(),'ether') + ' ether';

// TODO ask for more stuff

console.log("got claim price of " + currentClaimPrice);

console.log("Using template to generate README markdown for git and for the website ...");

var readmeTemplateSource = fs.readFileSync('templates/README.md.nunjucks', 'utf8');
var readmeContext = {
  targetIsGit: false,
  targetIsWeb: false,
  contractAddress: contractAddress,
  contractAbi: contractAbi,
  startingClaimPrice: startingClaimPrice,
  currentClaimPrice: currentClaimPrice,
  currentMonarch: {name: 'Kieran'},
  pastMonarchs: [{name: 'Kieran the Old'}]
};
readmeContext.targetIsGit = true;
readmeContext.targetIsWeb = false;
var gitReadMeMarkdown = nunjucks.renderString(readmeTemplateSource, readmeContext);
readmeContext.targetIsGit = false;
readmeContext.targetIsWeb = true;
var webReadMeMarkdown = nunjucks.renderString(readmeTemplateSource, readmeContext);

console.log("Writing git README.md");
fs.writeFileSync('README.md', gitReadMeMarkdown, 'utf8');

console.log("Generating home-page html for website from README markdown ...");

var readmeHtml = marked(webReadMeMarkdown);

console.log("Using template to write home-page html ...");

var indexTemplateSource = fs.readFileSync('templates/index.html.nunjucks', 'utf8');
var indexContext = {
  readmeHtml: readmeHtml
};
var indexHtml = nunjucks.renderString(indexTemplateSource, indexContext);
fs.writeFileSync('public/index.html', indexHtml, 'utf8');

console.log("Copying files needed by public web content at run-time");

cp.sync("node_modules/web3/dist/web3.js", "public/web3.js");