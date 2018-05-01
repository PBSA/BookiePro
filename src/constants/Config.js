import _ from 'lodash';
import { PrivateKey, PublicKey } from 'peerplaysjs-lib';
import { ChainConfig } from 'peerplaysjs-ws';
import { version } from '../../package.json'

const blockchainUrls = [
  // 'wss://595-dev-blockchain.pixelplex.by/ws',
  //'wss://peerplays-dev.blocktrades.info/',  
  "ws://ec2-35-183-1-21.ca-central-1.compute.amazonaws.com:8090"
// 'wss://api.ppytest.blckchnd.com'
]

// Shuffle list of blockchain nodes
// So every bookie app will not always connect to the first node in the list
const shuffledBlockhainUrls = _.shuffle(blockchainUrls)

const ASSET_ID = '1.3.1'

console.log('----- CONFIG -----')
console.log(PrivateKey)
console.log(PublicKey)
console.log(PublicKey.fromPublicKeyString)
console.log(PrivateKey.fromWif)

ChainConfig.setPrefix('PPY');

const Config = {
  version: version,
  oddsPrecision: 10000, // NOTE: I think this should be inside blockchain global objects, but it's not there yet so put it here temporarily
  blockchainUrls: shuffledBlockhainUrls,
  coreAsset: ASSET_ID,
  broadcastAccount: {
    name: 'pbsa-broadcasts',
    keys: {
      active: PublicKey.fromPublicKeyString("PPY56dsY8gV5PKe2iHcVQrusUuEcCR2hXfxz7598MJiotWNefqt4X")
    }
  },
  updateAccount: {
    name: 'bookie-updates',
    keys: {
      memo: PrivateKey.fromWif("5Hqs4vhUPQRjsyVm2e26ajF4W3UvY9Ah7T3Lmiqa2kqkyE7vukQ") 
    }
  },
  gatewayAccountName: 'gateway1', // Any transfer from this account is marked as deposit/ withdraw with gateway
  useDummyData: false, // Set to true if you want to use dummy data
  // Set this to false to register through faucet
  // Remember to set the faucet urls properly beforehand
  // We don't have faucet for blocktrades testnet
  registerThroughRegistrar: true,
  faucetUrls: ['https://595-dev-faucet.pixelplex.by'],
  accountRegistar: {
    name: 'nathan',
    keys: {
      owner: PrivateKey.fromWif('5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'),
      active: PrivateKey.fromWif('5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'),
      memo: PrivateKey.fromWif('5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3')
    },
  },
  dummyDataAccountId: '1.2.243', // TODO: remove this
  features: {
    withdrawels: false,
    deposits: false
  }
}


export default Config
