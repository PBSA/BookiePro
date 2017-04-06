import { Apis } from 'graphenejs-ws';
import { BlockchainUtils } from '../utility';
import { AppActions, AccountActions, NotificationActions, SoftwareUpdateActions } from '../actions';
import Immutable from 'immutable';
import { ObjectPrefix } from '../constants';
import { ChainValidation } from 'graphenejs-lib';
import _ from 'lodash';
import dummyData from '../dummyData';
const TIMEOUT_LENGTH = 500;

const { blockchainTimeStringToDate, getObjectIdPrefix } = BlockchainUtils;

class CommunicationService {
  static dispatch = null;
  static getState = null;

  static onUpdate(data) {
    // The resulted data is an array of array
    let updatedObjects = Immutable.fromJS(_.flatten(data));
    // console.log('updated', updatedObjects);
    updatedObjects.forEach((updatedObject) => {
      // If updatedObject is object_id instead of an object, it means that object is deleted
      if (ChainValidation.is_object_id(updatedObject)) {
        const deletedObjectId = updatedObject;
        this.deleteObject(deletedObjectId);
      } else {
        this.updateObject(updatedObject);
      }
    });
  }

  static updateObject(updatedObject) {
    const updatedObjectId = updatedObject.get('id');
    const updatedObjectIdPrefix = getObjectIdPrefix(updatedObjectId);
    switch (updatedObjectIdPrefix) {
      case ObjectPrefix.ACCOUNT_PREFIX: {
        const accountId = updatedObject.get('id');
        const myAccountId = this.getState().getIn(['account', 'account', 'id']);
        const softwareUpdateRefAccId = this.getState().getIn(['softwareUpdate', 'referenceAccount', 'id']);
        // Check if this account is related to my account or software update account
        if (accountId === myAccountId) {
          this.dispatch(AccountActions.setAccountAction(updatedObject));
        } else if (accountId === softwareUpdateRefAccId) {
          this.dispatch(SoftwareUpdateActions.setReferenceAccountAction(updatedObject));
        }
        break;
      }
      case ObjectPrefix.ASSET_PREFIX: {
        break;
      }
      case ObjectPrefix.OPERATION_HISTORY_PREFIX: {
        // TODO:
        break;
      }
      case ObjectPrefix.GLOBAL_PROPERTY_PREFIX: {
        // Update global property
        this.dispatch(AppActions.setBlockchainGlobalPropertyAction(updatedObject));
        break;
      }
      case ObjectPrefix.DYNAMIC_GLOBAL_PROPERTY_PREFIX: {
        // Update dynamic global property
        this.dispatch(AppActions.setBlockchainDynamicGlobalPropertyAction(updatedObject));
        break;
      }
      case ObjectPrefix.ACCOUNT_STAT_PREFIX: {
        const ownerId = updatedObject.get('owner');
        const myAccountId = this.getState().getIn(['account', 'account', 'id']);
        const softwareUpdateRefAccId = this.getState().getIn(['softwareUpdate', 'referenceAccount', 'id']);
        // Check if this statistic is related to my account or software update account
        if (ownerId === myAccountId) {
          // Check if this account made new transaction, if that's the case update the notification
          const mostRecentOp = this.getState().getIn(['account', 'statistics', 'most_recent_op']);
          const updatedMostRecentOp = updatedObject.get('most_recent_op')
          const hasMadeNewTransaction = updatedMostRecentOp !== mostRecentOp;
          if (hasMadeNewTransaction) {
            this.dispatch(NotificationActions.updateNotification());
          }
          // Set the newest statistic
          this.dispatch(AccountActions.setStatisticsAction(updatedObject));
        } else if (ownerId === softwareUpdateRefAccId) {
          // Check if this account made new transaction, if that's the case check for software update
          const mostRecentOp = this.getState().getIn(['softwareUpdate', 'referenceAccountStatistics', 'most_recent_op']);
          const updatedMostRecentOp = updatedObject.get('most_recent_op')
          const hasMadeNewTransaction = updatedMostRecentOp !== mostRecentOp;
          if (hasMadeNewTransaction) {
            this.dispatch(SoftwareUpdateActions.checkForSoftwareUpdate());
          }
          // Set the newest statistic
          this.dispatch(SoftwareUpdateActions.setReferenceAccountStatisticsAction(updatedObject));
        }
        break;
      }
      case ObjectPrefix.ACCOUNT_BALANCE_PREFIX: {
        const ownerId = updatedObject.get('owner');
        const myAccountId = this.getState().getIn(['account', 'account', 'id']);
        // Check if this balance related to my account
        if (ownerId === myAccountId) {
          this.dispatch(AccountActions.updateAvailableBalance(updatedObject));
        }
        break;
      }
      default: break;
    }

  }

  static deleteObject(deletedObjectId) {
    const deletedObjectIdPrefix = getObjectIdPrefix(deletedObjectId);
    switch (deletedObjectIdPrefix) {
      case ObjectPrefix.ACCOUNT_PREFIX: {
        // Check if this account is related to my account
        const myAccountId = this.getState().getIn(['account', 'account', 'id']);
        if (deletedObjectId === myAccountId) {
          // If it is, logout the user
          // This normally shouldn't happen
          this.dispatch(AccountActions.logout());
        }
        break;
      }
      case ObjectPrefix.ASSET_PREFIX: {
        break;
      }
      case ObjectPrefix.OPERATION_HISTORY_PREFIX: {
        break;
      }
      case ObjectPrefix.ACCOUNT_BALANCE_PREFIX: {
        this.dispatch(AccountActions.removeAvailableBalanceByIdAction(deletedObjectId));
        break;
      }
      default: break;
    }

  }

  /**
   * Sync communication service with blockchain, so it always has the latest data
   */
  static syncWithBlockchain(dispatch, getState) {
    return new Promise((resolve, reject) => {
      // Check if db api is ready
      let db_api = Apis.instance().db_api();
      if (!db_api) {
        return reject(new Error('Api not found, please ensure Apis from graphenejs-ws is initialized first'));
      }

      // Get current blockchain data (dynamic global property and global property), to ensure blockchain time is in sync
      db_api.exec('get_objects', [['2.1.0', '2.0.0']]).then( result => {
        const blockchainDynamicGlobalProperty = Immutable.fromJS(result[0]);
        const blockchainGlobalProperty = Immutable.fromJS(result[1]);
        const now = new Date().getTime();
        const headTime = blockchainTimeStringToDate(blockchainDynamicGlobalProperty.get('time')).getTime();
        const delta = (now - headTime)/1000;
        // Continue only if delta of computer current time and the blockchain time is less than a minute
        if (delta < 60) {
          // Subscribe to blockchain callback so the store is always has the latest data
          const onUpdate = this.onUpdate.bind(this);
          return Apis.instance().db_api().exec( 'set_subscribe_callback', [ onUpdate, true ] ).then(() => {
            // Sync success
            // Set reference to dispatch and getState
            this.dispatch = dispatch;
            this.getState = getState;
            // Save dynamic global property
            dispatch(AppActions.setBlockchainDynamicGlobalPropertyAction(blockchainDynamicGlobalProperty));
            // Save global property
            dispatch(AppActions.setBlockchainGlobalPropertyAction(blockchainGlobalProperty));
            resolve();
          });
        } else {
          throw new Error();
        }
      }).catch( error => {
        // Fail, return
        reject(new Error('Fail to Sync with Blockchain.'));
      })
    });
  }


  /**
   * Get list of assets
   */
  static getAssets(assetIds) {
    return Apis.instance().db_api().exec("get_objects", [[assetIds]]).then( assets => {
      return Immutable.fromJS(assets);
    });
  }

  /**
   * Get full account
   */
  static getFullAccount(accountNameOrId) {
    return Apis.instance().db_api().exec("get_full_accounts", [[accountNameOrId], true]).then( result => {
      const fullAccount = result && result[0] && result[0][1];
      // Return the full account
      return Immutable.fromJS(fullAccount);
    });
  }

 /**
  * Fetch recent history of an account
  */
  static fetchRecentHistory(accountId, stopTxHistoryId, limit=100) {
    // 1.11.0 denotes the current time
    const currentTimeTransactionId = ObjectPrefix.OPERATION_HISTORY_PREFIX + '.0';
    const startTxHistoryId = currentTimeTransactionId;
    return Apis.instance().history_api().exec('get_account_history',
                  [ accountId, stopTxHistoryId || currentTimeTransactionId, limit, startTxHistoryId]).then((history) => {
                    // Return immutable object to make it consistent with other functions
                    return Immutable.fromJS(history);
                  });
  }

  /**
   * Get all sports
   */
  static getAllSports() {
    // TODO: Replace later
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(Immutable.fromJS(dummyData.sports));
      }, TIMEOUT_LENGTH);
    });
  }

  /**
   * Get event groups given array of sport ids (can be immutable)
   */
  static getEventGroupsBySportIds(sportIds) {
    // TODO: Replace later
    const promises = sportIds.map( (sportId) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const filteredResult = _.filter(dummyData.eventGroups, (item) => {
            return item.sport_id === sportId;
          });
          resolve(filteredResult);
        }, TIMEOUT_LENGTH);
      });
    });
    return Promise.all(promises).then( result => {
      return Immutable.fromJS(_.flatten(result));
    });
  }


  /**
   * Get events given array of sport ids (can be immutable)
   */
  static getEventsBySportIds(sportIds) {
    // TODO: Replace later
    const promises = sportIds.map( (sportId) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const filteredResult = _.filter(dummyData.events, (item) => {
            return item.sport_id === sportId;
          });
          resolve(filteredResult);
        }, TIMEOUT_LENGTH);
      });
    });
    return Promise.all(promises).then( result => {
      return Immutable.fromJS(_.flatten(result));
    });
  }

  /**
   * Get comeptitors given array of sport ids (can be immutable)
   */
  static getCompetitorsBySportIds(sportIds) {
    // TODO: Replace later
    const promises = sportIds.map( (sportId) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const filteredResult = _.filter(dummyData.competitors, (item) => {
            return item.sport_id === sportId;
          });
          resolve(filteredResult);
        }, TIMEOUT_LENGTH);
      });
    });
    return Promise.all(promises).then( result => {
      return Immutable.fromJS(_.flatten(result));
    });
  }



  /**
   * Search events given keyword
   */
  static searchEvents(keyword) {
    // TODO: Replace Later
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredResult = _.filter(dummyData.events, (item) => {
          const team1Name = item.name.split(' vs ')[0];
          const team2Name = item.name.split(' vs ')[1];

          const keywordLowerCase = keyword.toLowerCase();

          const team1FirstName = team1Name.split(' ')[0].toLowerCase();
          const team2FirstName = team2Name.split(' ')[0].toLowerCase();
          return team1FirstName.startsWith(keywordLowerCase) || team2FirstName.startsWith(keywordLowerCase);

        });
        resolve(Immutable.fromJS(filteredResult));
      }, TIMEOUT_LENGTH);
    });
  }



  /**
   * Get any blockchain object given their id
   */
  static getObjectsByIds(arrayOfObjectIds = []) {
    // TODO: Replace Later
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredResult = [];
        // Iterate every object in dummy data to find the matching object
        let allObjects = [];
        _.forEach(dummyData, (item) => {
          allObjects = _.concat(allObjects, item);
        })
        _.forEach(allObjects, (item) => {
          if (arrayOfObjectIds.includes(item.id)) {
            filteredResult.push(item);
          }
        })
        resolve(Immutable.fromJS(filteredResult));
      }, TIMEOUT_LENGTH);
    });
  }

  /**
   * Get ongoing bets (unmatched and matched bets)
   */
  static getOngoingBets(accountId) {
    // TODO: Replace later
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredResult = _.filter(dummyData.bets, (item) => {
          return item.bettor_id === accountId;
        });
        resolve(Immutable.fromJS(filteredResult));
      }, TIMEOUT_LENGTH);
    });
  }

  /**
   * Get resolved bets
   */
  static getResolvedBets(accountId, startTime, stopTime) {
    // TODO: Replace later
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // TODO: still pending the format of resolved bets
        resolve(Immutable.List());
      }, TIMEOUT_LENGTH);
    });
  }

  /**
   * Get binned order books
   */
  static getBinnedOrderBook(bettingMarketId, binning_precision) {
    // TODO: Replace later
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let result = null;
        dummyData.binnedOrderBooks.forEach((orderBook) => {
          if (orderBook.betting_market_id === bettingMarketId) {
            result = orderBook;
            return false;
          }
        });

        resolve(Immutable.fromJS(result));
      }, TIMEOUT_LENGTH);
    })
  }

  /**
   * Withdraw money
   */
  static withdraw(walletAddress) {
    // TODO: Replace later
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, TIMEOUT_LENGTH);
    });
  }

  /**
   * Get deposit address
   */
  static getDepositAddress(accountId) {
    // TODO: Replace later
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('THISISDUMMYDEPOSITADDRESSFORANYACCOUNTID');
      }, TIMEOUT_LENGTH);
    });
  }

  /**
   * Get global betting statistics
   */
  static getGlobalBettingStatistics() {
    // TODO: Replace later
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(Immutable.fromJS(dummyData.globalBettingStatistics));
      }, TIMEOUT_LENGTH);
    });
  }

  /**
   * Get transaction history of an account
   */
  static getTransactionHistories(accountId, startTime, stopTime) {
    // TODO: Replace later
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // TODO: do it later, pending for confirmation from Dan
        resolve([]);
      }, TIMEOUT_LENGTH);
    });
  }

}

export default CommunicationService;
