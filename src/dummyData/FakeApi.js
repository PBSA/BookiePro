import sports from './sports';
import eventGroups from './eventGroups';
import competitors from './competitors';
import events from './events';
import _ from 'lodash';

const TIMEOUT_LENGTH = 500;

class FakeApi {
  static getSports() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(sports);
      }, TIMEOUT_LENGTH);
    });
  }

  static getEventGroups(sportId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredResult = _.filter(eventGroups, (item) => {
          return item.sport_id === sportId;
        });
        resolve(filteredResult);
      }, TIMEOUT_LENGTH);
    });
  }

  static getCompetitors(sportId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredResult = _.filter(competitors, (item) => {
          return item.sport_id === sportId;
        });
        resolve(filteredResult);
      }, TIMEOUT_LENGTH);
    });
  }

  static getEvents(sportId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredResult = _.filter(events, (item) => {
          return item.sport_id === sportId;
        });
        resolve(filteredResult);
      }, TIMEOUT_LENGTH);
    });
  }

  static searchEvents(keyword) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredResult = _.filter(events, (item) => {
          const team1Name = item.name.split(' vs ')[0];
          const team2Name = item.name.split(' vs ')[1];
          const team1FirstName = team1Name.split(' ')[0];
          const team2FirstName = team2Name.split(' ')[0];
          return team1FirstName.startsWith(keyword) || team2FirstName.startsWith(keyword);
        });
        resolve(filteredResult);
      }, TIMEOUT_LENGTH);
    });
  }

}

export default FakeApi
